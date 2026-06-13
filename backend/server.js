const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();

// --- CẤU HÌNH MIDDLEWARE (GIỮ NGUYÊN) ---
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const corsOptions = { origin: ['http://localhost:3000', 'http://localhost:5173'], optionsSuccessStatus: 200 };
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static('public'));
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// --- CẤU HÌNH DATABASE & CONNECTION POOL (GIỮ NGUYÊN) ---
const dbConfig = { user: process.env.DB_USER, password: process.env.DB_PASSWORD, server: process.env.DB_SERVER, database: process.env.DB_DATABASE, options: { encrypt: false, trustServerCertificate: true }};
const poolPromise = new sql.ConnectionPool(dbConfig).connect().then(pool => { console.log('✅ Đã kết nối tới SQL Server'); return pool; }).catch(err => console.error('❌ Kết nối database thất bại! Lỗi: ', err));


// =================================================================
// --- API ENDPOINTS ---
// =================================================================

// --- API BÀI VIẾT & PROFILE (GIỮ NGUYÊN) ---
app.get('/api/posts', async (req, res) => {
    const currentUserId = 1;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('current_user_id', sql.Int, currentUserId)
            .query(`
                SELECT
                    p.post_id, p.caption, p.photo_url, p.created_at,
                    u.user_id, u.username, u.profile_photo_url,
                    (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS like_count,
                    CAST(CASE WHEN EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.post_id AND pl.user_id = @current_user_id) THEN 1 ELSE 0 END AS BIT) AS is_liked_by_user,
                    (SELECT c.comment_id, c.comment_text, c.created_at, cu.user_id, cu.username FROM comments c JOIN users cu ON c.user_id = cu.user_id WHERE c.post_id = p.post_id ORDER BY c.created_at ASC FOR JSON PATH) AS comments
                FROM post p JOIN users u ON p.user_id = u.user_id
                ORDER BY p.created_at DESC
            `);
        const posts = result.recordset.map(post => ({ ...post, comments: post.comments ? JSON.parse(post.comments) : [] }));
        res.json(posts);
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi lấy bài viết", error: err.message });
    }
});
app.post('/api/posts', upload.single('postImage'), async (req, res) => {
    const { caption } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const userId = 1;
    if (!caption && !photoUrl) return res.status(400).send('Bài viết phải có nội dung hoặc ảnh.');
    try {
        const pool = await poolPromise;
        const insertResult = await pool.request().input('caption', sql.NVarChar, caption).input('photo_url', sql.VarChar, photoUrl).input('user_id', sql.Int, userId).query('INSERT INTO post (caption, photo_url, user_id) OUTPUT inserted.post_id VALUES (@caption, @photo_url, @user_id)');
        const newPostId = insertResult.recordset[0].post_id;
        const newPostData = await pool.request().input('newPostId', sql.Int, newPostId).query('SELECT p.*, u.username, u.profile_photo_url FROM post p JOIN users u ON p.user_id = u.user_id WHERE p.post_id = @newPostId');
        res.status(201).json(newPostData.recordset[0]);
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi đăng bài", error: err.message });
    }
});
app.post('/api/posts/:postId/like', async (req, res) => {
    const { postId } = req.params;
    const userId = 1;
    try {
        const pool = await poolPromise;
        const request = pool.request().input('user_id', sql.Int, userId).input('post_id', sql.Int, postId);
        const likeExists = await request.query('SELECT * FROM post_likes WHERE user_id = @user_id AND post_id = @post_id');
        if (likeExists.recordset.length > 0) {
            await request.query('DELETE FROM post_likes WHERE user_id = @user_id AND post_id = @post_id');
            res.json({ message: 'Unliked' });
        } else {
            await request.query('INSERT INTO post_likes (user_id, post_id) VALUES (@user_id, @post_id)');
            res.json({ message: 'Liked' });
        }
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi thích bài viết", error: err.message });
    }
});
app.post('/api/posts/:postId/comment', async (req, res) => {
    const { postId } = req.params;
    const { comment_text } = req.body;
    const userId = 1;
    if (!comment_text || !comment_text.trim()) return res.status(400).send('Nội dung bình luận không được để trống.');
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('post_id', sql.Int, postId).input('user_id', sql.Int, userId).input('comment_text', sql.NVarChar, comment_text).query('INSERT INTO comments (post_id, user_id, comment_text) OUTPUT inserted.comment_id, inserted.comment_text, inserted.created_at, inserted.user_id VALUES (@post_id, @user_id, @comment_text)');
        const newComment = result.recordset[0];
        const userResult = await pool.request().input('userId', sql.Int, newComment.user_id).query('SELECT username FROM users WHERE user_id = @userId');
        newComment.username = userResult.recordset[0].username;
        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi bình luận", error: err.message });
    }
});
app.get('/api/users/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const pool = await poolPromise;
        const userResult = await pool.request().input('username', sql.VarChar, username).query('SELECT user_id, username, bio, profile_photo_url FROM users WHERE username = @username');
        if (userResult.recordset.length === 0) return res.status(404).send('Không tìm thấy người dùng.');
        const userProfile = userResult.recordset[0];
        const postsResult = await pool.request().input('user_id', sql.Int, userProfile.user_id).query('SELECT post_id, photo_url, caption FROM post WHERE user_id = @user_id ORDER BY created_at DESC');
        userProfile.posts = postsResult.recordset;
        const statsResult = await pool.request().input('user_id', sql.Int, userProfile.user_id).query(`SELECT (SELECT COUNT(*) FROM post WHERE user_id = @user_id) as post_count, (SELECT COUNT(*) FROM follows WHERE followee_id = @user_id) as follower_count, (SELECT COUNT(*) FROM follows WHERE follower_id = @user_id) as following_count`);
        userProfile.stats = statsResult.recordset[0];
        res.json(userProfile);
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi lấy thông tin người dùng", error: err.message });
    }
});
app.patch('/api/profile', async (req, res) => {
    const userId = 1;
    const { username, bio } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request().input('user_id', sql.Int, userId).input('username', sql.VarChar, username).input('bio', sql.NVarChar, bio).query('UPDATE users SET username = @username, bio = @bio WHERE user_id = @user_id');
        res.status(200).json({ message: 'Cập nhật thông tin thành công!', username, bio });
    } catch (err) {
        if (err.number === 2627) return res.status(409).send({ message: 'Username này đã được sử dụng.' });
        res.status(500).send({ message: "Lỗi server khi cập nhật thông tin", error: err.message });
    }
});
app.post('/api/profile/avatar', upload.single('avatar'), async (req, res) => {
    const userId = 1;
    if (!req.file) return res.status(400).send('Vui lòng chọn một file ảnh.');
    const photoUrl = `/uploads/${req.file.filename}`;
    try {
        const pool = await poolPromise;
        await pool.request().input('user_id', sql.Int, userId).input('photo_url', sql.VarChar, photoUrl).query('UPDATE users SET profile_photo_url = @photo_url WHERE user_id = @user_id');
        res.status(200).json({ message: 'Cập nhật avatar thành công!', profile_photo_url: photoUrl });
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi cập nhật avatar", error: err.message });
    }
});

// --- API ĐĂNG KÝ (ĐÃ CẬP NHẬT LOG LỖI) ---
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).send({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }
    try {
        const pool = await poolPromise;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email)
            .input('password_hash', sql.VarChar, passwordHash)
            .query('INSERT INTO users (username, email, password_hash) OUTPUT inserted.user_id, inserted.username, inserted.email VALUES (@username, @email, @password_hash)');

        res.status(201).json(result.recordset[0]);
    } catch (err) {
        console.error("--- LỖI CHI TIẾT KHI ĐĂNG KÝ ---", err); // Log lỗi chi tiết ở backend
        if (err.number === 2627) {
            return res.status(409).send({ message: 'Username hoặc Email đã tồn tại.' });
        }
        // Trả về chi tiết lỗi cho frontend để debug
        res.status(500).send({ message: err.message });
    }
});

// --- API LẤY DANH SÁCH NGƯỜI DÙNG ---
app.get('/api/users', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT user_id, username, profile_photo_url FROM users ORDER BY created_at DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send({ message: 'Lỗi server khi lấy danh sách người dùng.', error: err.message });
    }
});


const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server đang chạy trên cổng ${port}`));
