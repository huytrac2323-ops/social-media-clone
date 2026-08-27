// File: controllers/postController.js
const { pool } = require('../config/db');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Cấu hình Cloudinary (Khai báo các biến này trong file .env trên Render)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// Lấy danh sách tất cả bài viết
// Lấy danh sách tất cả bài viết
const getPosts = async (req, res) => {
    const currentUserId = req.query.currentUserId || null;
    try {
        let query = `
            SELECT
                p.post_id, p.caption, p.photo_url, p.created_at,
                u.user_id, u.username, u.profile_photo_url,
                (SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id = p.post_id) AS like_count,
                (SELECT COUNT(*) FROM shares s WHERE s.post_id = p.post_id) AS sharesCount,
                ${currentUserId ? `EXISTS (SELECT 1 FROM post_reactions pr WHERE pr.post_id = p.post_id AND pr.user_id = $1) AS is_liked_by_user` : 'FALSE AS is_liked_by_user'},
                p.shared_post_id,
                (
                    SELECT json_build_object('post_id', op.post_id, 'caption', op.caption, 'photo_url', op.photo_url, 'username', ou.username, 'profile_photo_url', ou.profile_photo_url)
                    FROM post op JOIN users ou ON op.user_id = ou.user_id
                    WHERE op.post_id = p.shared_post_id
                ) AS shared_post,
                COALESCE(
                        (SELECT json_agg(json_build_object('comment_id', c.comment_id, 'comment_text', c.comment_text,
                                                           'created_at', c.created_at, 'user_id', cu.user_id, 'username',
                                                           cu.username,'profile_photo_url', cu.profile_photo_url))
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
                (SELECT COUNT(*) FROM shares s WHERE s.post_id = p.post_id) AS sharesCount,
                ${currentUserId ? `EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.post_id AND pl.user_id = $2
                ) AS is_liked_by_user` : 'FALSE AS is_liked_by_user'},
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
    // Chỉ lấy caption và user_id từ body
    const { caption, user_id } = req.body;

    if (!user_id) return res.status(401).send({ message: 'Yêu cầu cần có user_id.' });

    let finalPhotoUrl = null;

    try {
        // Kiểm tra nếu có file ảnh được đính kèm qua Multer
        if (req.file) {
            // Upload file từ thư mục tạm lên Cloudinary
            const uploadResult = await cloudinary.uploader.upload(req.file.path, {
                folder: 'social-media-clone-posts' // Gom nhóm ảnh gọn gàng trên Cloudinary
            });
//jj
            // Lấy đường link ảnh public
            finalPhotoUrl = uploadResult.secure_url;

            // Xóa file ảnh tạm ở server cục bộ (tránh đầy bộ nhớ ổ cứng)
            fs.unlinkSync(req.file.path);
        } else if (req.body.photo_url) {
            // Hỗ trợ trường hợp phụ: client gửi sẵn URL
            finalPhotoUrl = req.body.photo_url;
        }

        // Lưu dữ liệu vào database
        const result = await pool.query(
            'INSERT INTO post (user_id, caption, photo_url, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
            [user_id, caption, finalPhotoUrl]
        );
// Đảm bảo kết quả trả về JSON cho client có chứa trường created_at
        res.status(201).json(result.rows[0]);


    } catch (err) {
        // Dọn dẹp file tạm nếu quá trình upload hoặc lưu database bị lỗi
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
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
        console.log("ID người tạo bài:", postResult.rows[0].user_id, "| ID người bấm xóa:", Number(user_id));
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
        // Thêm NOW() để đảm bảo luôn có thời gian created_at
        const result = await pool.query(
            'INSERT INTO comments (post_id, user_id, comment_text, created_at) VALUES ($1, $2, $3, NOW()) RETURNING comment_id, comment_text, created_at, user_id',
            [postId, user_id, comment_text]
        );
        const newComment = result.rows[0];

        // Lấy cả username và profile_photo_url để hiển thị avatar bên phía giao diện
        const userResult = await pool.query('SELECT username, profile_photo_url FROM users WHERE user_id = $1', [newComment.user_id]);
        newComment.username = userResult.rows[0].username;
        newComment.profile_photo_url = userResult.rows[0].profile_photo_url;

        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi bình luận", error: err.message });
    }
};
        // Chia sẻ bài viết
// Chia sẻ bài viết (Nâng cấp tạo bài viết mới lên tường)
const sharePost = async (req, res) => {
    const { postId } = req.params; // ID của bài gốc
    const { caption } = req.body; // Lời tựa người dùng gõ thêm (VD: "Bài này hay quá")
    const user_id = req.user.id; // ID của người bấm share lấy từ Token

    if (!user_id) return res.status(401).send({ message: 'Không xác định được người dùng.' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Bắt đầu giao dịch bảo mật

        // 1. Kiểm tra xem người này đã share bài này chưa (Chống spam)
        const shareExists = await client.query('SELECT * FROM shares WHERE user_id = $1 AND post_id = $2', [user_id, postId]);
        if (shareExists.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'Bạn đã chia sẻ bài viết này rồi.' });
        }

        // 2. Ghi nhận lượt share vào bảng shares (Để tăng số đếm)
        await client.query('INSERT INTO shares (user_id, post_id, created_at) VALUES ($1, $2, NOW())', [user_id, postId]);

        // 3. TẠO BÀI VIẾT MỚI TRÊN TƯỜNG CỦA NGƯỜI SHARE
        // Bài viết này có caption mới, và có chứa shared_post_id trỏ về bài gốc
        await client.query(
            'INSERT INTO post (user_id, caption, shared_post_id, created_at) VALUES ($1, $2, $3, NOW())',
            [user_id, caption || '', postId]
        );

        // 4. Lấy tổng số lượng lượt share hiện tại để cập nhật UI
        const countResult = await client.query('SELECT COUNT(*) FROM shares WHERE post_id = $1', [postId]);

        await client.query('COMMIT'); // Lưu tất cả vào Database

        res.status(201).json({
            message: 'Chia sẻ bài viết lên tường thành công!',
            sharesCount: parseInt(countResult.rows[0].count)
        });
    } catch (err) {
        await client.query('ROLLBACK'); // Hủy thao tác nếu có lỗi
        if (err.code === '23505') {
            return res.status(400).json({ message: "Bạn đã chia sẻ bài viết này rồi." });
        }
        res.status(500).send({ message: "Lỗi server khi chia sẻ bài viết", error: err.message });
    } finally {
        client.release();
    }
};

module.exports = {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost,
    likePost,
    commentPost,
    sharePost,

};