const { pool } = require('../config/db');
const { createNotification } = require('./NotificationController');

// 1. GỬI LỜI MỜI KẾT BẠN
const sendFriendRequest = async (req, res) => {
    // Tự động bắt cả 2 định dạng tên biến để không bao giờ bị undefined
    const user_id = req.body.requester_id || req.body.user_id;
    const friend_id = req.body.addressee_id || req.body.friend_id;

    if (!user_id || !friend_id) {
        return res.status(400).json({ message: "Thiếu dữ liệu ID người dùng!" });
    }

    if (String(user_id) === String(friend_id)) {
        return res.status(400).json({ message: "Không thể tự kết bạn với chính mình!" });
    }

    try {
        const checkExist = await pool.query(
            `SELECT * FROM friends 
             WHERE (user_id = $1 AND friend_id = $2) 
                OR (user_id = $2 AND friend_id = $1)`,
            [user_id, friend_id]
        );

        if (checkExist.rows.length > 0) {
            const existing = checkExist.rows[0];
            if (existing.status === 'accepted') {
                return res.status(200).json({ message: "Hai bạn đã là bạn bè.", status: 'accepted' });
            }
            return res.status(200).json({ message: "Lời mời kết bạn đã được gửi trước đó.", status: 'pending' });
        }

        await pool.query(
            `INSERT INTO friends (user_id, friend_id, status) 
             VALUES ($1, $2, 'pending')`,
            [user_id, friend_id]
        );

        try {
            await createNotification({
                receiverId: friend_id,
                senderId: user_id,
                type: 'follow_request',
                content: 'đã gửi lời mời kết bạn cho bạn.'
            });
        } catch (notifErr) {
            console.warn('Lỗi gửi thông báo kết bạn:', notifErr.message);
        }

        res.status(200).json({ message: "Đã gửi lời mời kết bạn thành công!", status: 'pending' });
    } catch (err) {
        console.error("Lỗi server khi gửi lời mời kết bạn:", err);
        res.status(500).json({ message: "Lỗi server khi gửi lời mời.", error: err.message });
    }
};

// 2. CHẤP NHẬN LỜI MỜI KẾT BẠN
const acceptFriendRequest = async (req, res) => {
    const user_id = req.body.addressee_id || req.body.user_id; // Người nhận bấm chấp nhận
    const friend_id = req.body.requester_id || req.body.friend_id; // Người gửi lời mời

    try {
        const result = await pool.query(
            `UPDATE friends
             SET status = 'accepted'
             WHERE user_id = $2 AND friend_id = $1
                 RETURNING *`,
            [user_id, friend_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy lời mời kết bạn này." });
        }

        await pool.query(
            `INSERT INTO follows (follower_id, followee_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [friend_id, user_id]
        );
        try {
            await createNotification({
                receiverId: friend_id,
                senderId: user_id,
                type: 'follow',
                content: 'đã chấp nhận lời mời kết bạn của bạn.'
            });
        } catch (notifErr) {
            console.warn('Lỗi gửi thông báo accept friend:', notifErr.message);
        }
        res.status(200).json({ message: "Đã trở thành bạn bè!" });
    } catch (err) {
        console.error("Lỗi khi chấp nhận kết bạn:", err);
        res.status(500).json({ message: "Lỗi server khi chấp nhận kết bạn.", error: err.message });
    }
};

// 3. TỪ CHỐI / HỦY KẾT BẠN
const unfriendOrReject = async (req, res) => {
    const user1_id = req.body.user1_id || req.body.user_id;
    const user2_id = req.body.user2_id || req.body.friend_id;

    try {
        await pool.query(
            `DELETE FROM friends 
             WHERE (user_id = $1 AND friend_id = $2) 
                OR (user_id = $2 AND friend_id = $1)`,
            [user1_id, user2_id]
        );

        res.status(200).json({ message: "Đã hủy kết bạn / từ chối lời mời." });
    } catch (err) {
        console.error("Lỗi khi hủy kết bạn:", err);
        res.status(500).json({ message: "Lỗi server khi hủy kết bạn.", error: err.message });
    }
};

// 4. LẤY DANH SÁCH BẠN BÈ
const getFriendsList = async (req, res) => {
    const { user_id } = req.params;

    try {
        const friendsList = await pool.query(
            `SELECT u.user_id, u.username, u.profile_photo_url 
             FROM users u
             JOIN friends f ON (u.user_id = f.user_id OR u.user_id = f.friend_id)
             WHERE f.status = 'accepted' 
               AND (f.user_id = $1 OR f.friend_id = $1)
               AND u.user_id != $1`,
            [user_id]
        );

        res.status(200).json(friendsList.rows);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server khi lấy danh sách bạn bè.", error: err.message });
    }
};

const getFollowStatus = async (req, res) => {
    const followerId = req.params.followerId || req.query.followerId;
    const followeeId = req.params.followeeId || req.query.followeeId;
    try {
        const result = await pool.query(`
            SELECT
                EXISTS (
                    SELECT 1 FROM follows
                    WHERE follower_id = $1 AND followee_id = $2
                ) AS is_following,
                EXISTS (
                    SELECT 1 FROM friends
                    WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
                ) AS request_sent,
                EXISTS (
                    SELECT 1 FROM friends
                    WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
                      AND status = 'accepted'
                ) AS is_friend
        `, [followerId, followeeId]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Không thể kiểm tra trạng thái theo dõi.', error: err.message });
    }
};

const followUser = async (req, res) => {
    const followerId = req.body.follower_id || req.body.user_id;
    const followeeId = req.body.followee_id || req.body.target_id || req.body.friend_id;
    if (!followerId || !followeeId || String(followerId) === String(followeeId)) {
        return res.status(400).json({ message: 'Thông tin theo dõi không hợp lệ.' });
    }

    try {
        const target = await pool.query('SELECT is_private FROM users WHERE user_id = $1', [followeeId]);
        if (target.rowCount === 0) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });

        const isPrivate = Boolean(target.rows[0].is_private);
        if (isPrivate) {
            await pool.query(`
                INSERT INTO friends (user_id, friend_id, status)
                VALUES ($1, $2, 'pending')
                ON CONFLICT (user_id, friend_id) DO NOTHING
            `, [followerId, followeeId]);
            try {
                await createNotification({
                    receiverId: followeeId,
                    senderId: followerId,
                    type: 'follow_request',
                    content: 'đã gửi yêu cầu theo dõi bạn.'
                });
            } catch (notifErr) {
                console.warn('Lỗi gửi thông báo yêu cầu theo dõi:', notifErr.message);
            }
            return res.json({ status: 'pending', message: 'Đã gửi yêu cầu theo dõi.' });
        }

        await pool.query(
            'INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [followerId, followeeId]
        );
        try {
            await createNotification({
                receiverId: followeeId,
                senderId: followerId,
                type: 'follow',
                content: 'đã bắt đầu theo dõi bạn.'
            });
        } catch (notifErr) {
            console.warn('Lỗi gửi thông báo theo dõi:', notifErr.message);
        }
        res.json({ status: 'following', message: 'Đã theo dõi.' });
    } catch (err) {
        console.error('Lỗi khi theo dõi:', err);
        res.status(500).json({ message: 'Không thể theo dõi tài khoản.', error: err.message });
    }
};

const unfollowUser = async (req, res) => {
    const followerId = req.params.followerId || req.body?.follower_id || req.body?.user_id;
    const followeeId = req.params.followeeId || req.body?.followee_id || req.body?.target_id;
    if (!followerId || !followeeId) {
        return res.status(400).json({ message: 'Thông tin hủy theo dõi không hợp lệ.' });
    }
    try {
        await pool.query('DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2', [followerId, followeeId]);
        await pool.query(
            'DELETE FROM friends WHERE user_id = $1 AND friend_id = $2 AND status = \'pending\'',
            [followerId, followeeId]
        );
        res.json({ status: 'none', message: 'Đã hủy theo dõi.' });
    } catch (err) {
        console.error('Lỗi khi hủy theo dõi:', err);
        res.status(500).json({ message: 'Không thể hủy theo dõi.', error: err.message });
    }
};

// 5. KIỂM TRA TRẠNG THÁI KẾT BẠN
const checkFriendStatus = async (req, res) => {
    const { user1, user2 } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM friends
             WHERE (user_id = $1 AND friend_id = $2)
                OR (user_id = $2 AND friend_id = $1)`,
            [user1, user2]
        );

        if (result.rows.length === 0) {
            return res.json({ status: 'NONE' });
        }

        const relation = result.rows[0];
        if (relation.status === 'accepted') {
            return res.json({ status: 'ACCEPTED' });
        }

        if (relation.status === 'pending') {
            // Xác định ai là người gửi
            if (relation.user_id == user1) {
                return res.json({ status: 'PENDING_SENT' });
            } else {
                return res.json({ status: 'PENDING_RECEIVED' });
            }
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    unfriendOrReject,
    getFriendsList,
    checkFriendStatus,
    getFollowStatus,
    followUser,
    unfollowUser
};