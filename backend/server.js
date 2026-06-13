const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();

// --- CẤU HÌNH ---
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
const dbConfig = { user: process.env.DB_USER, password: process.env.DB_PASSWORD, server: process.env.DB_SERVER, database: process.env.DB_DATABASE, options: { encrypt: false, trustServerCertificate: true }};

let poolPromise;

// =================================================================
// --- API ENDPOINTS ---
// =================================================================

// --- AUTH ---
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).send({ message: 'Vui lòng điền đầy đủ thông tin.' });
    try {
        const pool = await poolPromise;
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const result = await pool.request().input('username', sql.VarChar, username).input('email', sql.VarChar, email).input('password_hash', sql.VarChar, passwordHash).query('INSERT INTO users (username, email, password_hash) OUTPUT inserted.user_id, inserted.username, inserted.email VALUES (@username, @email, @password_hash)');
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        if (err.number === 2627) return res.status(409).send({ message: 'Username hoặc Email đã tồn tại.' });
        res.status(500).send({ message: err.message });
    }
});
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send({ message: 'Vui lòng điền email và mật khẩu.' });
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('email', sql.VarChar, email).query('SELECT * FROM users WHERE email = @email');
        if (result.recordset.length === 0) return res.status(401).send({ message: 'Email hoặc mật khẩu không chính xác.' });
        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).send({ message: 'Email hoặc mật khẩu không chính xác.' });
        const { password_hash, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

// --- POSTS ---
app.get('/api/posts', async (req, res) => {
    const currentUserId = req.query.currentUserId || null;
    try {
        const pool = await poolPromise;
        const request = pool.request();
        if(currentUserId) request.input('current_user_id', sql.Int, currentUserId);
        const query = `
            SELECT
                p.post_id, p.caption, p.photo_url, p.created_at,
                u.user_id, u.username, u.profile_photo_url,
                (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS like_count,
                ${currentUserId ? `CAST(CASE WHEN EXISTS (SELECT 1 FROM post_likes pl WHERE pl.post_id = p.post_id AND pl.user_id = @current_user_id) THEN 1 ELSE 0 END AS BIT) AS is_liked_by_user` : 'CAST(0 AS BIT) as is_liked_by_user'},
                (SELECT c.comment_id, c.comment_text, c.created_at, cu.user_id, cu.username FROM comments c JOIN users cu ON c.user_id = cu.user_id WHERE c.post_id = p.post_id ORDER BY c.created_at ASC FOR JSON PATH) AS comments
            FROM post p JOIN users u ON p.user_id = u.user_id
            ORDER BY p.created_at DESC
        `;
        const result = await request.query(query);
        const posts = result.recordset.map(post => ({ ...post, comments: post.comments ? JSON.parse(post.comments) : [] }));
        res.json(posts);
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi lấy bài viết", error: err.message });
    }
});
app.post('/api/posts', upload.single('postImage'), async (req, res) => {
    const { caption, user_id } = req.body;
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!user_id) return res.status(401).send({ message: 'Yêu cầu cần có user_id.' });
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('caption', sql.NVarChar, caption).input('photo_url', sql.VarChar, photoUrl).input('user_id', sql.Int, user_id).query('INSERT INTO post (caption, photo_url, user_id) OUTPUT inserted.* VALUES (@caption, @photo_url, @user_id)');
        res.status(201).json(result.recordset[0]);
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi đăng bài", error: err.message });
    }
});
app.post('/api/posts/:postId/like', async (req, res) => {
    const { postId } = req.params;
    const { user_id } = req.body;
    if (!user_id) return res.status(401).send({ message: 'Yêu cầu cần có user_id.' });
    try {
        const pool = await poolPromise;
        const request = pool.request().input('user_id', sql.Int, user_id).input('post_id', sql.Int, postId);
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
    const { comment_text, user_id } = req.body;
    if (!user_id) return res.status(401).send({ message: 'Yêu cầu cần có user_id.' });
    try {
        const pool = await poolPromise;
        const result = await pool.request().input('post_id', sql.Int, postId).input('user_id', sql.Int, user_id).input('comment_text', sql.NVarChar, comment_text).query('INSERT INTO comments (post_id, user_id, comment_text) OUTPUT inserted.comment_id, inserted.comment_text, inserted.created_at, inserted.user_id VALUES (@post_id, @user_id, @comment_text)');
        const newComment = result.recordset[0];
        const userResult = await pool.request().input('userId', sql.Int, newComment.user_id).query('SELECT username FROM users WHERE user_id = @userId');
        newComment.username = userResult.recordset[0].username;
        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi bình luận", error: err.message });
    }
});

// --- USERS & PROFILE ---
app.get('/api/users', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT user_id, username, profile_photo_url FROM users ORDER BY created_at DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send({ message: 'Lỗi server khi lấy danh sách người dùng.', error: err.message });
    }
});

app.get('/api/users/:username', async (req, res) => {
    const { username } = req.params;
    console.log(`Bắt đầu lấy thông tin cho user: ${username}`);
    try {
        const pool = await poolPromise;
        console.log("1. Lấy thông tin user...");
        const userResult = await pool.request().input('username', sql.VarChar, username).query('SELECT user_id, username, bio, profile_photo_url FROM users WHERE username = @username');
        if (userResult.recordset.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy người dùng.' });
        }
        const userProfile = userResult.recordset[0];
        console.log("   => User ID:", userProfile.user_id);

        console.log("2. Lấy bài viết của user...");
        const postsResult = await pool.request().input('user_id', sql.Int, userProfile.user_id).query('SELECT post_id, photo_url, caption FROM post WHERE user_id = @user_id ORDER BY created_at DESC');
        userProfile.posts = postsResult.recordset;
        console.log(`   => Tìm thấy ${postsResult.recordset.length} bài viết.`);

        console.log("3. Lấy số liệu thống kê...");
        const statsResult = await pool.request()
            .input('user_id', sql.Int, userProfile.user_id)
            .query(`
                SELECT 
                    (SELECT COUNT(*) FROM post WHERE user_id = @user_id) as post_count,
                    (SELECT COUNT(*) FROM follows WHERE followee_id = @user_id) as follower_count,
                    (SELECT COUNT(*) FROM follows WHERE follower_id = @user_id) as following_count
            `);
        userProfile.stats = statsResult.recordset[0];
        console.log("   => Stats:", userProfile.stats);

        console.log("Hoàn tất, trả về dữ liệu.");
        res.json(userProfile);
    } catch (err) {
        console.error(`--- LỖI CHI TIẾT KHI LẤY PROFILE CỦA ${username} ---`);
        console.error(err);
        res.status(500).send({ message: "Lỗi server khi lấy thông tin người dùng", error: err.message });
    }
});

app.patch('/api/profile', async (req, res) => {
    const { username, bio, user_id } = req.body;
    if (!user_id) return res.status(401).send({ message: 'Yêu cầu cần có user_id.' });
    try {
        const pool = await poolPromise;
        const request = pool.request().input('user_id', sql.Int, user_id);

        // 1. Cập nhật thông tin
        await request
            .input('username', sql.VarChar, username)
            .input('bio', sql.NVarChar, bio)
            .query('UPDATE users SET username = @username, bio = @bio WHERE user_id = @user_id');

        // 2. Lấy lại thông tin người dùng đầy đủ
        const result = await request.query('SELECT * FROM users WHERE user_id = @user_id');
        const updatedUser = result.recordset[0];

        // 3. Loại bỏ mật khẩu và trả về
        const { password_hash, ...userWithoutPassword } = updatedUser;
        res.status(200).json({ message: 'Cập nhật thông tin thành công!', user: userWithoutPassword });

    } catch (err) {
        if (err.number === 2627) return res.status(409).send({ message: 'Username này đã được sử dụng.' });
        res.status(500).send({ message: "Lỗi server khi cập nhật thông tin", error: err.message });
    }
});
app.post('/api/profile/avatar', upload.single('avatar'), async (req, res) => {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).send({ message: 'Yêu cầu không hợp lệ, thiếu user_id.' });
    if (!req.file) return res.status(400).send({ message: 'Vui lòng chọn một file ảnh.' });
    const photoUrl = `/uploads/${req.file.filename}`;
    try {
        const pool = await poolPromise;
        await pool.request().input('user_id', sql.Int, user_id).input('photo_url', sql.VarChar, photoUrl).query('UPDATE users SET profile_photo_url = @photo_url WHERE user_id = @user_id');
        res.status(200).json({ message: 'Cập nhật avatar thành công!', profile_photo_url: photoUrl });
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi cập nhật avatar", error: err.message });
    }
});

// =================================================================
// --- KHỞI ĐỘNG SERVER ---
// =================================================================
const startServer = async () => {
    try {
        poolPromise = new sql.ConnectionPool(dbConfig).connect();
        const pool = await poolPromise;
        console.log("✅ Kết nối database thành công!");
        const port = process.env.PORT || 5000;
        app.listen(port, () => console.log(`✅ Server web đang chạy trên cổng ${port}`));
    } catch (err) {
        console.error("❌ LỖI KẾT NỐI DATABASE. SERVER KHÔNG THỂ KHỞI ĐỘNG.", err);
        process.exit(1);
    }
};

startServer();