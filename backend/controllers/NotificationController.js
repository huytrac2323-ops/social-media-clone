const { pool } = require('../config/db');

let notificationEmitter = null;

const setNotificationEmitter = emitter => {
    notificationEmitter = emitter;
};

const createNotification = async ({ receiverId, senderId, type, content, postId = null }) => {
    if (!receiverId || !senderId || String(receiverId) === String(senderId)) return;
    const result = await pool.query(
        `INSERT INTO notifications (receiver_id, sender_id, type, content, post_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING notification_id, receiver_id, sender_id, type, content, post_id, is_read, created_at`,
        [receiverId, senderId, type, content, postId]
    );
    if (!notificationEmitter) return;

    const sender = await pool.query(
        'SELECT username, profile_photo_url FROM users WHERE user_id = $1',
        [senderId]
    );
    notificationEmitter({
        receiverId,
        notification: {
            ...result.rows[0],
            username: sender.rows[0]?.username,
            profile_photo_url: sender.rows[0]?.profile_photo_url
        }
    });
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

module.exports = { getNotifications, markNotificationsRead, setNotificationEmitter };
module.exports.createNotification = createNotification;
