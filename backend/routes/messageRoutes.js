// File: routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const upload = require('../middlewares/upload');
const verifyToken = require('../middlewares/verifyToken');
const { savePost, unsavePost, getSavedPosts } = require('../controllers/SavedPostController');
const { pool } = require('../config/db'); // 👈 Thêm dòng này để khai báo biến pool kết nối database

router.patch('/:postId', postController.updatePost);
router.delete('/:postId', postController.deletePost);

router.post('/:postId/like', postController.likePost);
router.post('/:postId/comment', postController.commentPost);
router.post('/:postId/share', verifyToken, postController.sharePost);
router.post('/', upload.single('postImage'), postController.createPost);
router.post('/:postId/save', savePost);
router.get('/saved/:userId', getSavedPosts);

router.get('/', postController.getPosts);
router.get('/:postId', postController.getPostById);

// Thêm API lấy lịch sử tin nhắn giữa 2 người dùng[cite: 5]
router.get('/messages/:userId/:friendId', async (req, res) => {
    const { userId, friendId } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at ASC`,
            [userId, friendId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Lỗi lấy lịch sử tin nhắn:", error.message);
        res.status(500).json({ error: "Lỗi Server" });
    }
});

// Thêm API gửi tin nhắn mới[cite: 5]
router.post('/messages', async (req, res) => {
    const { sender_id, receiver_id, message_text } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, message_text) 
             VALUES ($1, $2, $3) RETURNING *`,
            [sender_id, receiver_id, message_text]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Lỗi gửi tin nhắn:", error.message);
        res.status(500).json({ error: "Lỗi Server" });
    }
});

module.exports = router;