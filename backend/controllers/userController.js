// File: controllers/userController.js
const { pool } = require('../config/db'); // 👈 Đúng
const {v2: cloudinary} = require("cloudinary"); // Dùng pool trực tiếp từ pg

// Cấu hình Cloudinary (Khai báo các biến này trong file .env trên Render)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// Lấy danh sách tất cả người dùng
const getUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT user_id, username, profile_photo_url FROM users ORDER BY created_at DESC');
        res.json(result.rows); // PostgreSQL trả kết quả về trong mảng .rows
    } catch (err) {
        res.status(500).send({ message: 'Lỗi server khi lấy danh sách người dùng.', error: err.message });
    }
};

// Lấy thông tin một người dùng cụ thể
const getUserByUsername = async (req, res) => {
    const { username } = req.params;
    try {
        const userResult = await pool.query('SELECT user_id, username, bio, profile_photo_url FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy người dùng.' });
        }
        const userProfile = userResult.rows[0];

        const postsResult = await pool.query('SELECT post_id, photo_url, caption FROM post WHERE user_id = $1 ORDER BY created_at DESC', [userProfile.user_id]);
        userProfile.posts = postsResult.rows;

        const statsResult = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM post WHERE user_id = $1) as post_count,
                (SELECT COUNT(*) FROM follows WHERE followee_id = $1) as follower_count,
                (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count
        `, [userProfile.user_id]);
        userProfile.stats = statsResult.rows[0];

        res.json(userProfile);
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi lấy thông tin người dùng", error: err.message });
    }
};

// Cập nhật thông tin profile
const updateProfile = async (req, res) => {
    const { username, bio, user_id } = req.body;
    if (!user_id) return res.status(401).send({ message: 'Yêu cầu cần có user_id.' });
    try {
        await pool.query(
            'UPDATE users SET username = $1, bio = $2 WHERE user_id = $3',
            [username, bio, user_id]
        );

        const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
        const updatedUser = result.rows[0];

        const { password_hash, ...userWithoutPassword } = updatedUser;
        res.status(200).json({ message: 'Cập nhật thông tin thành công!', user: userWithoutPassword });

    } catch (err) {
        if (err.code === '23505') return res.status(409).send({ message: 'Username này đã được sử dụng.' }); // Mã lỗi trùng lặp của PostgreSQL
        res.status(500).send({ message: "Lỗi server khi cập nhật thông tin", error: err.message });
    }
};

// Cập nhật ảnh đại diện (Avatar)
const updateAvatar = async (req, res) => {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).send({ message: 'Yêu cầu không hợp lệ, thiếu user_id.' });
    if (!req.file) return res.status(400).send({ message: 'Vui lòng chọn một file ảnh.' });

    try {
        // 1. Upload ảnh lên Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'social-media-clone-avatars' // Nên đặt tên folder khác với bài viết cho dễ quản lý
        });

        // 2. Lấy ĐÚNG ĐƯỜNG LINK ẢNH (secure_url) từ kết quả trả về
        const photoUrl = result.secure_url;

        // 3. Cập nhật Database
        await pool.query(
            'UPDATE users SET profile_photo_url = $1 WHERE user_id = $2',
            [photoUrl, user_id]
        );

        res.status(200).json({ message: 'Cập nhật avatar thành công!', profile_photo_url: photoUrl });
    } catch (err) {
        res.status(500).send({ message: "Lỗi server khi cập nhật avatar", error: err.message });
    }
};

module.exports = { getUsers, getUserByUsername, updateProfile, updateAvatar };