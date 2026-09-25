const { pool } = require('../config/db'); // 👈 Đúng
const {v2: cloudinary} = require("cloudinary"); // Dùng pool trực tiếp từ pg
const { createNotification } = require('./NotificationController');

// Cấu hình Cloudinary (Khai báo các biến này trong file .env trên Render)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// Lấy danh sách tất cả người dùng
const getUsers = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT user_id, COALESCE(username, 'user_' || user_id) AS username, 
                   email, phone, (email_verified IS TRUE) AS email_verified, (phone_verified IS TRUE) AS phone_verified,
                   profile_photo_url, (is_verified IS TRUE) AS is_verified, (is_banned IS TRUE) AS is_banned, 
                   COALESCE(open_for_collab, true) AS open_for_collab,
                   role, address, hometown, age, interests, bio, creator_type,
                   COALESCE(vip_tier, 'free') AS vip_tier, vip_badge, vip_expires_at, (ad_free IS TRUE) AS ad_free,
                   COALESCE(post_boost_credits, 0) AS post_boost_credits
            FROM users 
            ORDER BY (vip_tier IS NOT NULL AND vip_tier != 'free') DESC, created_at DESC
        `);
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
        const isNumeric = /^\d+$/.test(username);
        let userResult;
        const selectFields = `
            user_id, COALESCE(username, 'user_' || user_id) AS username, 
            email, phone, (email_verified IS TRUE) AS email_verified, (phone_verified IS TRUE) AS phone_verified,
            bio, profile_photo_url, (is_private IS TRUE) AS is_private, 
            (is_verified IS TRUE) AS is_verified, (is_banned IS TRUE) AS is_banned, 
            COALESCE(open_for_collab, true) AS open_for_collab,
            role, address, hometown, age, interests, creator_type,
            COALESCE(vip_tier, 'free') AS vip_tier, vip_badge, vip_expires_at, (ad_free IS TRUE) AS ad_free,
            COALESCE(post_boost_credits, 0) AS post_boost_credits
        `;
        if (isNumeric) {
            userResult = await pool.query(
                `SELECT ${selectFields} FROM users WHERE user_id = $1 OR username ILIKE $2`,
                [parseInt(username, 10), username]
            );
        } else {
            userResult = await pool.query(
                `SELECT ${selectFields} FROM users WHERE username ILIKE $1`,
                [username]
            );
        }
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
                address: userProfile.address,
                hometown: userProfile.hometown,
                age: userProfile.age,
                interests: userProfile.interests,
                is_verified: userProfile.is_verified,
                vip_tier: userProfile.vip_tier,
                vip_badge: userProfile.vip_badge,
                creator_type: userProfile.creator_type,
                open_for_collab: userProfile.open_for_collab,
                is_private: true,
                message: "Tài khoản riêng tư. Vui lòng kết bạn để xem bài viết."
            });
        }

        // ĐƯỢC PHÉP XEM: Tiếp tục query posts và stats như cũ
        const postsResult = await pool.query(`
            SELECT post_id, photo_url, caption, created_at,
                   post_type, title, project_images, tools_used, category,
                   COALESCE((SELECT COUNT(*)::int FROM post_likes pr WHERE pr.post_id = post.post_id), 0) AS like_count,
                   COALESCE(views_count, 0) AS views_count
            FROM post
            WHERE user_id = $1
            ORDER BY created_at DESC
        `, [userProfile.user_id]);
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


// Cập nhật thông tin profile (hỗ trợ cập nhật đầy đủ hoặc từng phần)
const updateProfile = async (req, res) => {
    const { username, bio, user_id, is_private, creator_type, address, hometown, age, interests, email, phone, open_for_collab } = req.body;
    if (!user_id) return res.status(401).send({ message: 'Yêu cầu cần có user_id.' });
    try {
        // Lấy thông tin hiện tại từ database để tránh ghi đè null lên các trường không gửi
        const currentResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
        if (currentResult.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        const current = currentResult.rows[0];

        const newUsername = (username !== undefined && username !== null && String(username).trim())
            ? String(username).trim()
            : current.username;
        const newBio = bio !== undefined ? bio : current.bio;
        const newIsPrivate = is_private !== undefined ? Boolean(is_private) : Boolean(current.is_private);
        const newCreatorType = creator_type !== undefined ? (creator_type || null) : current.creator_type;
        const newAddress = address !== undefined ? (address || null) : current.address;
        const newHometown = hometown !== undefined ? (hometown || null) : current.hometown;
        const parsedAge = (age !== undefined && age !== null && age !== '' && !isNaN(Number(age)))
            ? parseInt(age, 10)
            : (age === null || age === '' ? null : current.age);
        const newInterests = interests !== undefined ? (interests || null) : current.interests;
        const newOpenForCollab = open_for_collab !== undefined ? Boolean(open_for_collab) : (current.open_for_collab !== false);

        // Xử lý email & phone
        let newEmail = current.email;
        let newEmailVerified = current.email_verified;
        if (email !== undefined) {
            const cleanEmail = email && String(email).trim() ? String(email).trim().toLowerCase() : null;
            if (cleanEmail && cleanEmail !== current.email) {
                const existEmail = await pool.query('SELECT user_id FROM users WHERE email ILIKE $1 AND user_id != $2', [cleanEmail, user_id]);
                if (existEmail.rows.length > 0) {
                    return res.status(409).json({ message: 'Email này đã được sử dụng bởi một tài khoản khác.' });
                }
                newEmail = cleanEmail;
                newEmailVerified = false; // Đổi email thì cần xác minh lại
            } else if (cleanEmail === null) {
                newEmail = null;
                newEmailVerified = false;
            }
        }

        let newPhone = current.phone;
        let newPhoneVerified = current.phone_verified;
        if (phone !== undefined) {
            const cleanPhone = phone && String(phone).trim() ? String(phone).trim().replace(/[^0-9+]/g, '') : null;
            if (cleanPhone && cleanPhone !== current.phone) {
                const existPhone = await pool.query('SELECT user_id FROM users WHERE phone = $1 AND user_id != $2', [cleanPhone, user_id]);
                if (existPhone.rows.length > 0) {
                    return res.status(409).json({ message: 'Số điện thoại này đã được sử dụng bởi một tài khoản khác.' });
                }
                newPhone = cleanPhone;
                newPhoneVerified = false; // Đổi số điện thoại thì cần xác minh lại
            } else if (cleanPhone === null) {
                newPhone = null;
                newPhoneVerified = false;
            }
        }

        // Cập nhật an toàn vào cơ sở dữ liệu
        await pool.query(
            `UPDATE users 
             SET username = $1, 
                 bio = $2, 
                 is_private = $3,
                 creator_type = $4,
                 address = $5,
                 hometown = $6,
                 age = $7,
                 interests = $8,
                 email = $9,
                 phone = $10,
                 email_verified = $11,
                 phone_verified = $12,
                 open_for_collab = $13
             WHERE user_id = $14`,
            [
                newUsername, 
                newBio, 
                newIsPrivate, 
                newCreatorType,
                newAddress, 
                newHometown, 
                parsedAge, 
                newInterests,
                newEmail,
                newPhone,
                newEmailVerified,
                newPhoneVerified,
                newOpenForCollab,
                user_id
            ]
        );

        // Truy vấn lại chính xác thông tin mới nhất từ cơ sở dữ liệu để trả về
        const result = await pool.query(
            `SELECT user_id, username, email, phone, (email_verified IS TRUE) AS email_verified, (phone_verified IS TRUE) AS phone_verified,
                    bio, profile_photo_url, 
                    (is_private IS TRUE) AS is_private, 
                    (is_verified IS TRUE) AS is_verified, 
                    (is_banned IS TRUE) AS is_banned,
                    COALESCE(open_for_collab, true) AS open_for_collab,
                    role,
                    creator_type, address, hometown, age, interests 
             FROM users WHERE user_id = $1`, 
            [user_id]
        );
        const updatedUser = result.rows[0];

        res.status(200).json({ message: 'Cập nhật thông tin thành công!', user: updatedUser });

    } catch (err) {
        if (err.code === '23505') return res.status(409).send({ message: 'Username hoặc thông tin này đã được sử dụng.' });
        res.status(500).send({ message: "Lỗi server khi cập nhật thông tin", error: err.message });
    }
};

// Bật/tắt trạng thái đang nhận dự án nhanh từ Cài đặt & Tùy chọn
const toggleOpenForCollab = async (req, res) => {
    const userId = req.user?.id || req.body.user_id || req.body.userId;
    if (!userId) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập để thay đổi cài đặt.' });
    }

    try {
        const currentRes = await pool.query('SELECT open_for_collab FROM users WHERE user_id = $1', [userId]);
        if (currentRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        const currentVal = currentRes.rows[0].open_for_collab;
        const nextStatus = req.body.open_for_collab !== undefined 
            ? Boolean(req.body.open_for_collab) 
            : !(currentVal === true);

        await pool.query('UPDATE users SET open_for_collab = $1 WHERE user_id = $2', [nextStatus, userId]);

        return res.json({
            success: true,
            open_for_collab: nextStatus,
            message: nextStatus ? 'Đã bật trạng thái: Đang nhận dự án & Hợp tác!' : 'Đã chuyển sang trạng thái: Tạm ngưng nhận dự án.'
        });
    } catch (err) {
        console.error('Lỗi toggleOpenForCollab:', err);
        return res.status(500).json({ message: 'Lỗi server khi đổi trạng thái nhận dự án.', error: err.message });
    }
};

// Store OTP xác thực email và số điện thoại
const contactOtpStore = new Map();

const maskContact = (type, val) => {
    if (!val) return '';
    if (type === 'email') {
        const [name, domain] = val.split('@');
        if (!domain) return val;
        if (name.length <= 2) return `${name[0]}*@${domain}`;
        return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
    }
    const s = String(val).trim();
    if (s.length <= 4) return s;
    return `${s.slice(0, 3)}****${s.slice(-3)}`;
};

// Gửi mã OTP xác thực email hoặc số điện thoại
const sendContactOtp = async (req, res) => {
    try {
        const { userId, type, value } = req.body;
        if (!userId || !type || !value) {
            return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin.' });
        }
        const cleanVal = String(value).trim();
        if (type === 'email') {
            if (!cleanVal.includes('@') || !cleanVal.includes('.')) {
                return res.status(400).json({ message: 'Địa chỉ email không đúng định dạng.' });
            }
            const exists = await pool.query('SELECT user_id FROM users WHERE email ILIKE $1 AND user_id != $2', [cleanVal, userId]);
            if (exists.rows.length > 0) {
                return res.status(409).json({ message: 'Email này đã được sử dụng bởi một tài khoản khác.' });
            }
        } else if (type === 'phone') {
            const phoneDigits = cleanVal.replace(/[^0-9+]/g, '');
            if (phoneDigits.length < 9 || phoneDigits.length > 15) {
                return res.status(400).json({ message: 'Số điện thoại không hợp lệ (cần từ 9 đến 15 số).' });
            }
            const exists = await pool.query('SELECT user_id FROM users WHERE phone = $1 AND user_id != $2', [phoneDigits, userId]);
            if (exists.rows.length > 0) {
                return res.status(409).json({ message: 'Số điện thoại này đã được sử dụng bởi một tài khoản khác.' });
            }
        } else {
            return res.status(400).json({ message: 'Loại liên hệ không hợp lệ.' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const key = `${userId}_${type}`;
        contactOtpStore.set(key, {
            code: otpCode,
            value: type === 'phone' ? cleanVal.replace(/[^0-9+]/g, '') : cleanVal.toLowerCase(),
            expiresAt: Date.now() + 10 * 60 * 1000
        });

        const contactName = type === 'email' ? 'Email' : 'Số điện thoại';
        await createNotification({
            receiverId: userId,
            senderId: userId,
            type: 'system',
            content: `🔐 Mã xác thực ${contactName} của bạn: ${otpCode} (Hết hạn trong 10 phút).`
        });

        console.log(`[CONTACT OTP] ${contactName} cho User ${userId} (${cleanVal}): ${otpCode}`);

        res.status(200).json({
            message: `Mã xác nhận đã được gửi đến ${contactName} ${maskContact(type, cleanVal)}!`,
            maskedValue: maskContact(type, cleanVal),
            devOtp: otpCode
        });
    } catch (err) {
        console.error('Lỗi sendContactOtp:', err);
        res.status(500).json({ message: 'Lỗi server khi gửi mã OTP.', error: err.message });
    }
};

// Xác nhận mã OTP để hoàn tất xác minh hoặc đổi thông tin liên hệ
const verifyContactOtp = async (req, res) => {
    try {
        const { userId, type, otpCode } = req.body;
        if (!userId || !type || !otpCode) {
            return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mã OTP.' });
        }

        const key = `${userId}_${type}`;
        const stored = contactOtpStore.get(key);
        if (!stored) {
            return res.status(400).json({ message: 'Yêu cầu không tồn tại hoặc đã hết hạn. Vui lòng bấm gửi lại mã.' });
        }

        if (Date.now() > stored.expiresAt) {
            contactOtpStore.delete(key);
            return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng gửi mã mới.' });
        }

        if (stored.code !== String(otpCode).trim()) {
            return res.status(400).json({ message: 'Mã OTP xác thực không chính xác.' });
        }

        contactOtpStore.delete(key);

        let updateQuery = '';
        let params = [];
        if (type === 'email') {
            updateQuery = `
                UPDATE users 
                SET email = $1, email_verified = TRUE 
                WHERE user_id = $2 
                RETURNING user_id, username, email, phone, (email_verified IS TRUE) AS email_verified, (phone_verified IS TRUE) AS phone_verified, profile_photo_url, (is_verified IS TRUE) AS is_verified, role
            `;
            params = [stored.value, userId];
        } else {
            updateQuery = `
                UPDATE users 
                SET phone = $1, phone_verified = TRUE 
                WHERE user_id = $2 
                RETURNING user_id, username, email, phone, (email_verified IS TRUE) AS email_verified, (phone_verified IS TRUE) AS phone_verified, profile_photo_url, (is_verified IS TRUE) AS is_verified, role
            `;
            params = [stored.value, userId];
        }

        const result = await pool.query(updateQuery, params);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        const updated = result.rows[0];
        const contactName = type === 'email' ? 'Email' : 'Số điện thoại';

        await createNotification({
            receiverId: userId,
            senderId: userId,
            type: 'system',
            content: `🎉 Chúc mừng! Bạn đã xác minh ${contactName} (${stored.value}) thành công!`
        });

        res.status(200).json({
            message: `Xác minh ${contactName} thành công!`,
            user: updated
        });
    } catch (err) {
        console.error('Lỗi verifyContactOtp:', err);
        res.status(500).json({ message: 'Lỗi server khi xác minh mã OTP.', error: err.message });
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

module.exports = { getUsers, getUserByUsername, updateProfile, updateAvatar, sendContactOtp, verifyContactOtp, toggleOpenForCollab };