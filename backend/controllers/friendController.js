const { pool } = require('../config/db'); // 👈 Đúng
// 1. GỬI LỜI MỜI KẾT BẠN
const sendFriendRequest = async (req, res) => {
    const { requester_id, addressee_id } = req.body;

    if (requester_id === addressee_id) {
        return res.status(400).json({ message: "Không thể tự kết bạn với chính mình!" });
    }

    try {
        // Kiểm tra xem 2 người đã có quan hệ gì trước đó chưa (đã gửi lời mời, hoặc đã là bạn)
        const checkExist = await pool.query(
            `SELECT * FROM friendships 
             WHERE (requester_id = $1 AND addressee_id = $2) 
                OR (requester_id = $2 AND addressee_id = $1)`,
            [requester_id, addressee_id]
        );

        if (checkExist.rows.length > 0) {
            return res.status(400).json({ message: "Lời mời kết bạn đã tồn tại hoặc hai người đã là bạn bè." });
        }

        // Bắn lệnh INSERT vào database
        await pool.query(
            `INSERT INTO friendships (requester_id, addressee_id, status) 
             VALUES ($1, $2, 'PENDING')`,
            [requester_id, addressee_id]
        );

        res.status(200).json({ message: "Đã gửi lời mời kết bạn thành công!" });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server khi gửi lời mời.", error: err.message });
    }
};

// 2. CHẤP NHẬN LỜI MỜI KẾT BẠN
const acceptFriendRequest = async (req, res) => {
    const { requester_id, addressee_id } = req.body;
    // addressee_id chính là người đang thao tác bấm nút "Chấp nhận"

    try {
        const result = await pool.query(
            `UPDATE friendships 
             SET status = 'ACCEPTED', updated_at = CURRENT_TIMESTAMP 
             WHERE requester_id = $1 AND addressee_id = $2 
             RETURNING *`,
            [requester_id, addressee_id]
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
    const { user1_id, user2_id } = req.body;

    try {
        // Dù là A gửi cho B hay B gửi cho A, cứ hễ hủy là xóa sạch dòng đó khỏi database
        await pool.query(
            `DELETE FROM friendships 
             WHERE (requester_id = $1 AND addressee_id = $2) 
                OR (requester_id = $2 AND addressee_id = $1)`,
            [user1_id, user2_id]
        );

        res.status(200).json({ message: "Đã hủy kết bạn / từ chối lời mời." });
    } catch (err) {
        res.status(500).json({ message: "Lỗi server khi hủy kết bạn.", error: err.message });
    }
};

// 4. LẤY DANH SÁCH BẠN BÈ (Siêu Query JOIN bảng)
const getFriendsList = async (req, res) => {
    const { user_id } = req.params;

    try {
        // Nghệ thuật JOIN: Lấy thông tin từ bảng users của những người đã 'ACCEPTED'
        const friendsList = await pool.query(
            `SELECT u.user_id, u.username, u.profile_photo_url 
             FROM users u
             JOIN friendships f ON (u.user_id = f.requester_id OR u.user_id = f.addressee_id)
             WHERE f.status = 'ACCEPTED' 
               AND (f.requester_id = $1 OR f.addressee_id = $1)
               AND u.user_id != $1`, // Trừ chính bản thân mình ra
            [user_id]
        );

        res.status(200).json(friendsList.rows);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server khi lấy danh sách bạn bè.", error: err.message });
    }
};
// Bổ sung vào cuối file friendController.js
const checkFriendStatus = async (req, res) => {
    const { user1, user2 } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM friendships
             WHERE (requester_id = $1 AND addressee_id = $2)
                OR (requester_id = $2 AND addressee_id = $1)`,
            [user1, user2]
        );

        if (result.rows.length === 0) {
            return res.json({ status: 'NONE' });
        }

        const relation = result.rows[0];
        if (relation.status === 'ACCEPTED') {
            return res.json({ status: 'ACCEPTED' });
        }

        if (relation.status === 'PENDING') {
            if (relation.requester_id == user1) {
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