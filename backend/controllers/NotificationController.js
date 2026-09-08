const { pool } = require('../config/db');

const createNotification = async ({ receiverId, senderId, type, content, postId = null }) => {
    if (!receiverId || !senderId || String(receiverId) === String(senderId)) return;
    await pool.query(
        `INSERT INTO notifications (receiver_id, sender_id, type, content, post_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [receiverId, senderId, type, content, postId]
    );
};
const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(
            'SELECT n.*, u.username, u.profile_photo_url FROM notifications n JOIN users u ON u.user_id = n.sender_id WHERE n.receiver_id = $1 ORDER BY n.created_at DESC LIMIT 50',
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Lỗi khi lấy thông báo:", error.message);
        res.status(500).json({ error: "Lỗi Server" });
    }
};

const markNotificationsRead = async (req, res) => {
    try {
        await pool.query('UPDATE notifications SET is_read = TRUE WHERE receiver_id = $1', [req.params.userId]);
        res.json({ message: 'Đã đánh dấu đã đọc.' });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi Server' });
    }
};

module.exports = { getNotifications, markNotificationsRead };
module.exports.createNotification = createNotification;
