// File: controllers/postController.js
const pool = require('../config/db');

// Lấy danh sách tất cả bài viết
const getPosts = async (req, res) => {
    const currentUserId = req.query.currentUserId || null;
    try {
        let query = `
            SELECT
                p.post_id, p.caption, p.photo_url, p.created_at,
                u.user_id, u.username, u.profile_photo_url,
                (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS like_count,
                ${currentUserId ? `EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.post_id AND pl.user_id = $1) AS is_liked_by_user` : 'FALSE AS is_liked_by_user'},
                COALESCE(
                    (SELECT json_agg(json_build_object('comment_id', c.comment_id, 'comment_text', c.comment_text, 'created_at', c.created_at, 'user_id', cu.user_id, 'username', cu.username))
                     FROM (SELECT * FROM comments WHERE post_id = p.post_id ORDER BY created_at ASC) c 
                     JOIN users cu ON c.user_id = cu.user_id), 
                '[]'::json) AS comments
            FROM post p JOIN users u ON p.user_id = u.user_id
            ORDER BY p.created_at DESC
        `;
        const params = currentUserId ? [currentUserId] : [];
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi lấy bài viết", error: err.message });
    }
};

// Lấy chi tiết 1 bài viết
const getPostById = async (req, res) => {
    const { postId } = req.params;
    const currentUserId = req.query.currentUserId || null;
    try {
        let query = `
            SELECT
                p.post_id, p.caption, p.photo_url, p.created_at,
                u.user_id, u.username, u.profile_photo_url,
                (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS like_count,
                ${currentUserId ? `EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.post_id AND pl.user_id = $2) AS is_liked_by_user` : 'FALSE AS is_liked_by_user'},
                COALESCE(
                    (SELECT json_agg(json_build_object('comment_id', c.comment_id, 'comment_text', c.comment_text, 'created_at', c.created_at, 'user_id', cu.user_id, 'username', cu.username))
                     FROM (SELECT * FROM comments WHERE post_id = p.post_id ORDER BY created_at ASC) c 
                     JOIN users cu ON c.user_id = cu.user_id), 
                '[]'::json) AS comments
            FROM post p JOIN users u ON p.user_id = u.user_id
            WHERE p.post_id = $1
        `;
        const params = currentUserId ? [postId, currentUserId] : [postId];
        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy bài viết.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi lấy bài viết chi tiết", error: err.message });
    }
};

// Tạo bài viết mới
const createPost = async (req, res) => {
    const { caption, user_id } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!user_id) return res.status(401).send({ message: 'Yêu cầu cần có user_id.' });
    try {
        // ĐÚNG: Chỉ truyền các trường cần thiết
        const result = await pool.query(
            'INSERT INTO post (user_id, caption, photo_url) VALUES ($1, $2, $3) RETURNING *',
            [userId, caption, photoUrl]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi đăng bài", error: err.message });
    }
};

// Cập nhật bài viết
const updatePost = async (req, res) => {
    const { postId } = req.params;
    const { caption, user_id } = req.body;
    if (!user_id) return res.status(401).send({ message: 'Yêu cầu cần có user_id để xác thực.' });
    try {
        const postResult = await pool.query('SELECT user_id FROM post WHERE post_id = $1', [postId]);
        if (postResult.rows.length === 0) return res.status(404).send({ message: 'Bài viết không tồn tại.' });
        if (postResult.rows[0].user_id !== Number(user_id)) return res.status(403).send({ message: 'Bạn không có quyền sửa bài viết này.' });

        await pool.query('UPDATE post SET caption = $1 WHERE post_id = $2', [caption, postId]);
        res.status(200).json({ message: 'Cập nhật bài viết thành công!', caption });
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi cập nhật bài viết", error: err.message });
    }
};

// Xóa bài viết
const deletePost = async (req, res) => {
    const { postId } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(401).send({ message: 'Yêu cầu cần có user_id để xác thực.' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const postResult = await client.query('SELECT user_id FROM post WHERE post_id = $1', [postId]);
        if (postResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send({ message: 'Bài viết không tồn tại.' });
        }
        if (postResult.rows[0].user_id !== Number(user_id)) {
            await client.query('ROLLBACK');
            return res.status(403).send({ message: 'Bạn không có quyền xóa bài viết này.' });
        }

        await client.query('DELETE FROM post_likes WHERE post_id = $1', [postId]);
        await client.query('DELETE FROM comments WHERE post_id = $1', [postId]);
        await client.query('DELETE FROM post WHERE post_id = $1', [postId]);

        await client.query('COMMIT');
        res.status(200).json({ message: 'Xóa bài viết thành công.' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).send({ message: "Lỗi server khi xóa bài viết", error: err.message });
    } finally {
        client.release();
    }
};

// Thích bài viết
const likePost = async (req, res) => {
    const { postId } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(401).send({ message: 'Yêu cầu cần có user_id.' });
    try {
        const likeExists = await pool.query('SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2', [user_id, postId]);
        if (likeExists.rows.length > 0) {
            await pool.query('DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2', [user_id, postId]);
            res.json({ message: 'Unliked' });
        } else {
            await pool.query('INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)', [user_id, postId]);
            res.json({ message: 'Liked' });
        }
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi thích bài viết", error: err.message });
    }
};

// Bình luận bài viết
const commentPost = async (req, res) => {
    const { postId } = req.params;
    const { comment_text, user_id } = req.body;
    if (!user_id) return res.status(401).send({ message: 'Yêu cầu cần có user_id.' });
    try {
        const result = await pool.query(
            'INSERT INTO comments (post_id, user_id, comment_text) VALUES ($1, $2, $3) RETURNING comment_id, comment_text, created_at, user_id',
            [postId, user_id, comment_text]
        );
        const newComment = result.rows[0];
        const userResult = await pool.query('SELECT username FROM users WHERE user_id = $1', [newComment.user_id]);
        newComment.username = userResult.rows[0].username;
        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi bình luận", error: err.message });
    }
};

module.exports = {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    likePost,
    commentPost
};