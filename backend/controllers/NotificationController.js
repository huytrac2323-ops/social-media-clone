const { pool } = require('../config/db');
const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            'SELECT * FROM notifications WHERE receiver_id = $1 ORDER BY created_at DESC', // 👈 Đã sửa user_id thành receiver_id
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Lỗi khi lấy thông báo:", error.message);
        res.status(500).json({ error: "Lỗi Server" });
    }
};

module.exports = { getNotifications };

