// File: controllers/authController.js
const { pool } = require('../config/db'); // 👈 Đúng
const jwt = require('jsonwebtoken'); // Nhớ khai báo cái này ở đầu file nếu chưa có
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const issueUserToken = user => {
    const { password_hash: ignoredPassword, ...userWithoutPassword } = user;
    return {
        user: userWithoutPassword,
        token: jwt.sign(
            { id: user.user_id },
            process.env.JWT_SECRET || 'chuoi_bi_mat_cua_ban',
            { expiresIn: '7d' }
        )
    };
};

const register = async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).send({ message: 'Vui lòng điền đầy đủ thông tin.' });

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING user_id, username, email',
            [username, email, passwordHash]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).send({ message: 'Username hoặc Email đã tồn tại.' });
        res.status(500).send({ message: err.message });
    }
};


const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).send({ message: 'Vui lòng điền email và mật khẩu.' });

    try {
        const result = await pool.query(
            'SELECT * FROM users WHERE username ILIKE $1',
            [username]
        );

        if (result.rows.length === 0) return res.status(401).send({ message: '"Sai mật khẩu rồi bạn ơi! Bản cập nhật mới nè' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).send({ message: '"Sai mật khẩu rồi bạn ơi! Bản cập nhật mới nè.' });

        const { password_hash, ...userWithoutPassword } = user;

        // 1. TẠO TOKEN NGAY TẠI ĐÂY
        // Mã hóa user_id vào token để sau này Middleware verifyToken có thể đọc được
        const token = jwt.sign(
            { id: user.user_id },
            process.env.JWT_SECRET || 'chuoi_bi_mat_cua_ban', // Secret key
            { expiresIn: '7d' } // Token có hạn trong 7 ngày
        );

        // 2. TRẢ VỀ CẢ USER LẪN TOKEN CHO FRONTEND
        res.status(200).json({
            message: "Đăng nhập thành công",
            user: userWithoutPassword,
            token: token // Đây là cái mà nãy giờ Frontend đang "khát"!
        });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

const googleLogin = async (req, res) => {
    const { credential } = req.body;
    if (!credential || !process.env.GOOGLE_CLIENT_ID) {
        return res.status(400).json({ message: 'Google OAuth chưa được cấu hình.' });
    }
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (!payload?.email || !payload.email_verified) {
            return res.status(401).json({ message: 'Tài khoản Google chưa xác thực email.' });
        }

        let result = await pool.query('SELECT * FROM users WHERE email ILIKE $1 LIMIT 1', [payload.email]);
        let user = result.rows[0];
        if (!user) {
            const baseUsername = (payload.email.split('@')[0] || 'google_user').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 24);
            const username = `${baseUsername}_${String(payload.sub).slice(-6)}`;
            const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
            result = await pool.query(
                `INSERT INTO users (username, email, password_hash, profile_photo_url)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [username, payload.email, passwordHash, payload.picture || null]
            );
            user = result.rows[0];
        } else {
            let needsUpdate = false;
            let newPhoto = user.profile_photo_url;
            let newUsername = user.username;

            if (payload.picture && user.profile_photo_url !== payload.picture) {
                newPhoto = payload.picture;
                needsUpdate = true;
            }
            if (!user.username || user.username === 'null') {
                const base = (payload.email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20);
                newUsername = `${base}_${user.user_id}`;
                needsUpdate = true;
            }

            if (needsUpdate) {
                const updated = await pool.query(
                    'UPDATE users SET profile_photo_url = $1, username = $2 WHERE user_id = $3 RETURNING *',
                    [newPhoto, newUsername, user.user_id]
                );
                user = updated.rows[0];
            }
        }

        const { password_hash: ignoredPassword, ...userWithoutPassword } = user;
        const token = jwt.sign(
            { id: user.user_id },
            process.env.JWT_SECRET || 'chuoi_bi_mat_cua_ban',
            { expiresIn: '7d' }
        );
        res.json({ message: 'Đăng nhập Google thành công', user: userWithoutPassword, token });
    } catch (err) {
        res.status(401).json({ message: 'Token Google không hợp lệ.' });
    }
};

const facebookLogin = async (req, res) => {
    const { accessToken } = req.body;
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!accessToken || !appId || !appSecret) {
        return res.status(400).json({ message: 'Facebook OAuth chưa được cấu hình.' });
    }
    try {
        const appToken = `${appId}|${appSecret}`;
        const debugResponse = await fetch(`https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appToken)}`);
        const debugData = await debugResponse.json();
        const tokenData = debugData.data;
        if (!debugResponse.ok || !tokenData?.is_valid || String(tokenData.app_id) !== String(appId)) {
            return res.status(401).json({ message: 'Token Facebook không hợp lệ.' });
        }
        const profileResponse = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`);
        const profile = await profileResponse.json();
        if (!profileResponse.ok || !profile.id) {
            return res.status(401).json({ message: 'Không thể lấy thông tin tài khoản Facebook.' });
        }

        const email = profile.email || `facebook_${profile.id}@facebook.local`;
        let result = await pool.query('SELECT * FROM users WHERE email ILIKE $1 LIMIT 1', [email]);
        let user = result.rows[0];
        if (!user) {
            const username = `${(profile.name || 'facebook_user').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 24)}_${String(profile.id).slice(-6)}`;
            const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
            result = await pool.query(
                `INSERT INTO users (username, email, password_hash, profile_photo_url)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [username, email, passwordHash, profile.picture?.data?.url || null]
            );
            user = result.rows[0];
        }
        const auth = issueUserToken(user);
        res.json({ message: 'Đăng nhập Facebook thành công', ...auth });
    } catch (err) {
        res.status(502).json({ message: 'Không thể xác thực Facebook.' });
    }
};
const logout = async (req,res)=>{
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer')){
            return res.status(400).json({ message:'ko tìm thấy toekn hợp lệ'})
        }

        const token = authHeader.split(' ')[1];
        await pool.query('INSERT INTO token_blacklist (token) VALUES ($1)' , [token])

        res.status(200).json ({message: "đăng xuất thành công!"});
        } catch (error) {
            res.status(500).json({ message: "lỗi server khi đăng xuất", error: error.message });
        }
    };

    const requestPasswordReset = async (req, res) => {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Vui lòng nhập email.' });
        try {
            const userResult = await pool.query('SELECT user_id FROM users WHERE email ILIKE $1 LIMIT 1', [email.trim()]);
            if (userResult.rowCount > 0) {
                const token = crypto.randomBytes(32).toString('hex');
                await pool.query(
                    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
                     VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
                    [userResult.rows[0].user_id, crypto.createHash('sha256').update(token).digest('hex')]
                );
                if (process.env.NODE_ENV !== 'production') console.info(`[password-reset] ${email}: ${token}`);
            }
            res.json({ message: 'Nếu email tồn tại, hướng dẫn khôi phục đã được gửi.' });
        } catch (err) {
            res.status(500).json({ message: 'Không thể tạo yêu cầu khôi phục.', error: err.message });
        }
    };

    const resetPassword = async (req, res) => {
        const { token, password } = req.body;
        if (!token || !password || password.length < 8) {
            return res.status(400).json({ message: 'Mã khôi phục và mật khẩu mới tối thiểu 8 ký tự là bắt buộc.' });
        }
        try {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const tokenResult = await pool.query(
                `SELECT id, user_id FROM password_reset_tokens
                 WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL
                 ORDER BY created_at DESC LIMIT 1`,
                [tokenHash]
            );
            if (!tokenResult.rowCount) return res.status(400).json({ message: 'Mã khôi phục không hợp lệ hoặc đã hết hạn.' });
            const passwordHash = await bcrypt.hash(password, 10);
            await pool.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [passwordHash, tokenResult.rows[0].user_id]);
            await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [tokenResult.rows[0].id]);
            res.json({ message: 'Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.' });
        } catch (err) {
            res.status(500).json({ message: 'Không thể đổi mật khẩu.', error: err.message });
        }
    };
deleteAccount = async (req, res) => {
    const { userId } = req.params;
    try {
        // Lưu ý: Nếu database có các bảng liên kết (posts, comments),
        // cần đảm bảo đã set khóa ngoại ON DELETE CASCADE, nếu không sẽ bị lỗi khóa ngoại.
        const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }
        res.status(200).json({ message: "Đã xóa tài khoản thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { register, login, googleLogin, facebookLogin, logout, deleteAccount, requestPasswordReset, resetPassword };