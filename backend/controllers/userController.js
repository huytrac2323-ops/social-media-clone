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
    // Hỗ trợ lấy viewer_id từ nhiều nguồn khác nhau để không bị thiếu sót
    const viewer_id = req.user?.id || req.query.viewer_id || req.headers['x-viewer-id'];
    try {
        const userResult = await pool.query(
            'SELECT user_id, username, bio, profile_photo_url, (is_private IS TRUE) AS is_private FROM users WHERE username = $1',
            [username]
        );
        if (userResult.rows.length === 0) {
            return res.status(404).send({ message: 'Không tìm thấy người dùng.' });
        }
        const userProfile = userResult.rows[0];
        let isAllowedToView = true;

        // 1. Kiểm tra xem người xem có phải là chủ tài khoản không
        const isOwner = viewer_id && String(viewer_id) === String(userProfile.user_id);

        // 2. Nếu tài khoản riêng tư và KHÔNG PHẢI là chủ tài khoản
        if (userProfile.is_private === true && !isOwner) {
            isAllowedToView = false; // Mặc định chặn tất cả người khác

            // 3. Nếu có viewer_id, kiểm tra xem đã là bạn bè chưa
            if (viewer_id) {
                const friendCheck = await pool.query(
                    `SELECT * FROM friends
                     WHERE ((user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1))
                       AND status = 'accepted'`,
                    [viewer_id, userProfile.user_id]
                );
                // Nếu tồn tại quan hệ bạn bè đã chấp nhận thì cho phép xem
                if (friendCheck.rowCount > 0) {
                    isAllowedToView = true;
                }
            }
        }

        // Nếu không được phép xem, trả về thông báo khóa và không lộ bài viết
        if (!isAllowedToView) {
            return res.json({
                user_id: userProfile.user_id,
                username: userProfile.username,
                profile_photo_url: userProfile.profile_photo_url,
                bio: userProfile.bio,
                is_private: true,
                message: "Tài khoản riêng tư. Vui lòng kết bạn để xem bài viết."
            });
        }
        // ... (phần code query bài viết giữ nguyên phía dưới)

        // ĐƯỢC PHÉP XEM: Tiếp tục query posts và stats như cũ
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
    const { username, bio, user_id, is_private } = req.body;
    if (!user_id) return res.status(401).send({ message: 'Yêu cầu cần có user_id.' });
    try {
        // Thực hiện cập nhật đầy đủ cả username, bio và trạng thái is_private
        await pool.query(
            'UPDATE users SET username = $1, bio = $2, is_private = COALESCE($3, is_private) WHERE user_id = $4',
            [username, bio, is_private, user_id]
        );

        // Truy vấn lại chính xác thông tin mới nhất từ cơ sở dữ liệu để trả về
        const result = await pool.query('SELECT user_id, username, bio, profile_photo_url, is_private FROM users WHERE user_id = $1', [user_id]);
        const updatedUser = result.rows[0];

        res.status(200).json({ message: 'Cập nhật thông tin thành công!', user: updatedUser });

    } catch (err) {
        if (err.code === '23505') return res.status(409).send({ message: 'Username này đã được sử dụng.' });
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