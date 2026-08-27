const pool = require('../config/db');

const getMessages = async (req, res) => {
    const { friendId } = req.params;
    const { currentUserId } = req.query; // Sẽ lấy từ URL: ?currentUserId=...

    if (!currentUserId) {
        return res.status(400).json({ error: "Thiếu ID người dùng hiện tại" });
    }

    try {
        // Lấy tin nhắn giữa 2 người, sắp xếp theo thời gian cũ -> mới
        const result = await pool.query(
            `SELECT * FROM messages
             WHERE (sender_id = $1 AND receiver_id = $2)
                OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY sent_at ASC`,
            [currentUserId, friendId]
        );

        // Format lại dữ liệu cho giống với state của Frontend
        const formattedMessages = result.rows.map(msg => ({
            id: msg.id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            content: msg.content,
            created_at: msg.sent_at
        }));

        res.status(200).json(formattedMessages);
    } catch (error) {
        console.error("Lỗi khi lấy tin nhắn:", error);
        res.status(500).json({ error: "Lỗi Server" });
    }
};

module.exports = { getMessages };