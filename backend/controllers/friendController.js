const { pool } = require('../config/db');

// 1. GỬI LỜI MỜI KẾT BẠN
const sendFriendRequest = async (req, res) => {
    // Tự động bắt cả 2 định dạng tên biến để không bao giờ bị undefined
    const user_id = req.body.requester_id || req.body.user_id;
    const friend_id = req.body.addressee_id || req.body.friend_id;

    if (!user_id || !friend_id) {
        return res.status(400).json({ message: "Thiếu dữ liệu ID người dùng!" });
    }

    if (user_id === friend_id) {
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
            return res.status(400).json({ message: "Lời mời kết bạn đã tồn tại hoặc hai người đã là bạn bè." });
        }

        await pool.query(
            `INSERT INTO friends (user_id, friend_id, status) 
             VALUES ($1, $2, 'pending')`,
            [user_id, friend_id]
        );

        res.status(200).json({ message: "Đã gửi lời mời kết bạn thành công!" });
    } catch (err) {
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

        res.status(200).json({ message: "Đã trở thành bạn bè!" });
    } catch (err) {
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
    checkFriendStatus
};