const { pool } = require('../config/db');
const { createNotification } = require('./NotificationController');

// 1. Thống kê tổng quan nền tảng
const getAdminStats = async (req, res) => {
    try {
        const [
            usersCountRes,
            creatorsCountRes,
            verifiedCountRes,
            postsCountRes,
            commentsCountRes,
            pendingReqRes,
            creatorTypesRes,
            recentUsersRes
        ] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM users'),
            pool.query("SELECT COUNT(*) FROM users WHERE creator_type IS NOT NULL AND creator_type <> ''"),
            pool.query('SELECT COUNT(*) FROM users WHERE is_verified IS TRUE'),
            pool.query('SELECT COUNT(*) FROM post'),
            pool.query('SELECT COUNT(*) FROM comments'),
            pool.query("SELECT COUNT(*) FROM verification_requests WHERE status = 'pending'"),
            pool.query(`
                SELECT creator_type, COUNT(*) as count 
                FROM users 
                WHERE creator_type IS NOT NULL AND creator_type <> '' 
                GROUP BY creator_type 
                ORDER BY count DESC 
                LIMIT 10
            `),
            pool.query(`
                SELECT user_id, username, profile_photo_url, creator_type, 
                       (is_verified IS TRUE) AS is_verified, 
                       (is_banned IS TRUE) AS is_banned,
                       role, created_at 
                FROM users 
                ORDER BY created_at DESC 
                LIMIT 6
            `)
        ]);

        res.status(200).json({
            stats: {
                totalUsers: parseInt(usersCountRes.rows[0].count, 10),
                totalCreators: parseInt(creatorsCountRes.rows[0].count, 10),
                totalVerified: parseInt(verifiedCountRes.rows[0].count, 10),
                totalPosts: parseInt(postsCountRes.rows[0].count, 10),
                totalComments: parseInt(commentsCountRes.rows[0].count, 10),
                pendingRequests: parseInt(pendingReqRes.rows[0].count, 10)
            },
            creatorBreakdown: creatorTypesRes.rows,
            recentUsers: recentUsersRes.rows
        });
    } catch (err) {
        console.error('Lỗi khi lấy thống kê admin:', err);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê.', error: err.message });
    }
};

// 2. Danh sách người dùng (tìm kiếm & lọc)
const getAdminUsers = async (req, res) => {
    try {
        const { search, role, creator_type, is_verified, is_banned } = req.query;

        let query = `
            SELECT user_id, username, email, profile_photo_url, 
                   bio, address, hometown, age, interests,
                   creator_type, 
                   (is_verified IS TRUE) AS is_verified, 
                   (is_banned IS TRUE) AS is_banned,
                   (is_private IS TRUE) AS is_private,
                   role, created_at,
                   (SELECT COUNT(*) FROM post WHERE post.user_id = users.user_id) AS post_count,
                   (SELECT COUNT(*) FROM follows WHERE followee_id = users.user_id) AS follower_count
            FROM users
            WHERE 1=1
        `;
        const params = [];

        if (search && search.trim()) {
            params.push(`%${search.trim()}%`);
            query += ` AND (username ILIKE $${params.length} OR email ILIKE $${params.length} OR address ILIKE $${params.length})`;
        }

        if (role) {
            params.push(role);
            query += ` AND role = $${params.length}`;
        }

        if (creator_type) {
            params.push(creator_type);
            query += ` AND creator_type = $${params.length}`;
        }

        if (is_verified !== undefined && is_verified !== '') {
            query += is_verified === 'true' ? ' AND is_verified IS TRUE' : ' AND (is_verified IS NULL OR is_verified IS FALSE)';
        }

        if (is_banned !== undefined && is_banned !== '') {
            query += is_banned === 'true' ? ' AND is_banned IS TRUE' : ' AND (is_banned IS NULL OR is_banned IS FALSE)';
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Lỗi khi lấy danh sách người dùng:', err);
        res.status(500).json({ message: 'Lỗi server.', error: err.message });
    }
};

// Store OTP xác nhận đổi quyền qua email
const roleOtpStore = new Map();

const maskEmail = (email) => {
    if (!email || !email.includes('@')) return email || 'email của bạn';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
};

// 3. Bật/Tắt tích xanh cho người dùng (Chỉ Admin đã có tích xanh mới được cấp)
const toggleVerifyUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.user.id;

        const result = await pool.query(
            `UPDATE users 
             SET is_verified = NOT COALESCE(is_verified, FALSE) 
             WHERE user_id = $1 
             RETURNING user_id, username, is_verified`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        const updated = result.rows[0];
        res.status(200).json({
            message: updated.is_verified ? 'Đã cấp tích xanh thành công!' : 'Đã thu hồi tích xanh!',
            user: updated
        });
    } catch (err) {
        console.error('Lỗi toggle tích xanh:', err);
        res.status(500).json({ message: 'Lỗi server.', error: err.message });
    }
};

// 4. Khóa / Mở khóa tài khoản (Ban/Unban)
const toggleBanUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.user.id;

        if (String(userId) === String(adminId)) {
            return res.status(400).json({ message: 'Bạn không thể tự khóa tài khoản của chính mình!' });
        }

        const result = await pool.query(
            `UPDATE users 
             SET is_banned = NOT COALESCE(is_banned, FALSE) 
             WHERE user_id = $1 
             RETURNING user_id, username, is_banned`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        const updated = result.rows[0];
        res.status(200).json({
            message: updated.is_banned ? 'Đã khóa tài khoản thành công!' : 'Đã mở khóa tài khoản!',
            user: updated
        });
    } catch (err) {
        console.error('Lỗi toggle ban user:', err);
        res.status(500).json({ message: 'Lỗi server.', error: err.message });
    }
};

// Gửi mã OTP xác thực qua email để cấp/hạ quyền
const requestRoleOtp = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { userId, role } = req.body;

        if (String(userId) === String(adminId)) {
            return res.status(400).json({ message: 'Bạn không thể tự thay đổi quyền hạn của chính mình!' });
        }

        const adminRes = await pool.query('SELECT user_id, email, username FROM users WHERE user_id = $1', [adminId]);
        if (adminRes.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin quản trị viên.' });
        }

        const adminEmail = adminRes.rows[0].email;
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000;

        roleOtpStore.set(String(adminId), {
            code: otpCode,
            userId: String(userId),
            role,
            expiresAt
        });

        await createNotification({
            receiverId: adminId,
            senderId: adminId,
            type: 'system',
            content: `🔐 Mã bảo mật xác nhận cấp quyền Admin: ${otpCode} (Hết hạn trong 10 phút).`
        });

        console.log(`[ADMIN SECURITY] OTP xác nhận đổi quyền cho ${adminEmail}: ${otpCode}`);

        res.status(200).json({
            message: `Mã xác nhận bảo mật đã được gửi đến email ${maskEmail(adminEmail)}. Vui lòng kiểm tra mã để hoàn tất!`,
            email: maskEmail(adminEmail),
            devOtp: otpCode
        });
    } catch (err) {
        console.error('Lỗi gửi OTP cấp quyền:', err);
        res.status(500).json({ message: 'Lỗi server.', error: err.message });
    }
};

// 5. Thay đổi quyền hạn (Yêu cầu xác thực OTP qua Email và không cho phép tự hạ chính mình)
const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role, otpCode } = req.body;
        const adminId = req.user.id;

        if (String(userId) === String(adminId)) {
            return res.status(400).json({ message: 'Bạn không thể tự thay đổi quyền của chính mình!' });
        }

        if (!['admin', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Vai trò chỉ có thể là admin hoặc user.' });
        }

        // Kiểm tra OTP xác thực email
        const storedOtp = roleOtpStore.get(String(adminId));
        if (!storedOtp) {
            return res.status(400).json({ message: 'Vui lòng nhấn nhận mã xác thực qua Email trước khi đổi quyền!' });
        }

        if (Date.now() > storedOtp.expiresAt) {
            roleOtpStore.delete(String(adminId));
            return res.status(400).json({ message: 'Mã xác nhận đã hết hạn. Vui lòng lấy mã mới.' });
        }

        if (storedOtp.code !== String(otpCode || '').trim() || storedOtp.userId !== String(userId) || storedOtp.role !== role) {
            return res.status(400).json({ message: 'Mã xác nhận email không chính xác!' });
        }

        roleOtpStore.delete(String(adminId));

        const result = await pool.query(
            `UPDATE users 
             SET role = $1 
             WHERE user_id = $2 
             RETURNING user_id, username, role`,
            [role, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }

        res.status(200).json({
            message: `Xác nhận email thành công! Đã cập nhật vai trò người dùng thành ${role}!`,
            user: result.rows[0]
        });
    } catch (err) {
        console.error('Lỗi cập nhật role:', err);
        res.status(500).json({ message: 'Lỗi server.', error: err.message });
    }
};

// 6. Danh sách đơn xin cấp tích xanh
const getVerificationRequests = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT vr.*, u.username, u.email, u.profile_photo_url, (u.is_verified IS TRUE) as current_verified
            FROM verification_requests vr
            JOIN users u ON vr.user_id = u.user_id
            WHERE 1=1
        `;
        const params = [];

        if (status && status !== 'all') {
            params.push(status);
            query += ` AND vr.status = $${params.length}`;
        }

        query += ' ORDER BY vr.created_at DESC';

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy danh sách đơn tích xanh:', err);
        res.status(500).json({ message: 'Lỗi server.', error: err.message });
    }
};

// 7. Duyệt đơn tích xanh
const approveVerificationRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { admin_note } = req.body;
        const adminId = req.user.id;

        // Cập nhật trạng thái đơn
        const updateReq = await pool.query(
            `UPDATE verification_requests 
             SET status = 'approved', admin_note = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE request_id = $2 
             RETURNING *`,
            [admin_note || 'Đã được Quản trị viên duyệt', requestId]
        );

        if (updateReq.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu xét duyệt.' });
        }

        const requestData = updateReq.rows[0];

        // Cấp tích xanh cho người dùng
        await pool.query(
            'UPDATE users SET is_verified = TRUE WHERE user_id = $1',
            [requestData.user_id]
        );

        // Gửi thông báo đến người dùng
        await createNotification({
            receiverId: requestData.user_id,
            senderId: adminId,
            type: 'system',
            content: '🎉 Chúc mừng! Đơn xin cấp Tích Xanh của bạn đã được Admin phê duyệt. Bạn đã chính thức sở hữu huy hiệu tích xanh uy tín!'
        });

        res.status(200).json({
            message: 'Đã phê duyệt yêu cầu và cấp tích xanh thành công!',
            request: requestData
        });
    } catch (err) {
        console.error('Lỗi duyệt tích xanh:', err);
        res.status(500).json({ message: 'Lỗi server.', error: err.message });
    }
};

// 8. Từ chối đơn tích xanh
const rejectVerificationRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { admin_note } = req.body;
        const adminId = req.user.id;

        const note = admin_note?.trim() || 'Hồ sơ chưa đủ điều kiện tiêu chuẩn cấp tích xanh.';

        const updateReq = await pool.query(
            `UPDATE verification_requests 
             SET status = 'rejected', admin_note = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE request_id = $2 
             RETURNING *`,
            [note, requestId]
        );

        if (updateReq.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy yêu cầu xét duyệt.' });
        }

        const requestData = updateReq.rows[0];

        // Gửi thông báo lý do từ chối
        await createNotification({
            receiverId: requestData.user_id,
            senderId: adminId,
            type: 'system',
            content: `Yêu cầu cấp Tích Xanh của bạn chưa được duyệt. Lý do: ${note}`
        });

        res.status(200).json({
            message: 'Đã từ chối yêu cầu cấp tích xanh.',
            request: requestData
        });
    } catch (err) {
        console.error('Lỗi từ chối tích xanh:', err);
        res.status(500).json({ message: 'Lỗi server.', error: err.message });
    }
};

// 9. Danh sách bài viết toàn hệ thống
const getAdminPosts = async (req, res) => {
    try {
        const { search } = req.query;
        let query = `
            SELECT p.post_id, p.caption, p.photo_url, p.created_at, p.user_id,
                   u.username, u.profile_photo_url, (u.is_verified IS TRUE) as is_verified,
                   (SELECT COUNT(*) FROM likes WHERE post_id = p.post_id) AS like_count,
                   (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) AS comment_count
            FROM post p
            JOIN users u ON p.user_id = u.user_id
            WHERE 1=1
        `;
        const params = [];

        if (search && search.trim()) {
            params.push(`%${search.trim()}%`);
            query += ` AND (p.caption ILIKE $${params.length} OR u.username ILIKE $${params.length})`;
        }

        query += ' ORDER BY p.created_at DESC LIMIT 100';

        const result = await pool.query(query, params);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy bài viết quản trị:', err);
        res.status(500).json({ message: 'Lỗi server.', error: err.message });
    }
};

// 10. Xóa bài viết vi phạm bởi Quản trị viên
const deleteAdminPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const result = await pool.query('DELETE FROM post WHERE post_id = $1 RETURNING post_id', [postId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Bài viết không tồn tại hoặc đã bị xóa.' });
        }

        res.status(200).json({ message: 'Đã xóa bài viết vi phạm thành công!' });
    } catch (err) {
        console.error('Lỗi xóa bài viết quản trị:', err);
        res.status(500).json({ message: 'Lỗi server.', error: err.message });
    }
};

module.exports = {
    getAdminStats,
    getAdminUsers,
    toggleVerifyUser,
    toggleBanUser,
    requestRoleOtp,
    updateUserRole,
    getVerificationRequests,
    approveVerificationRequest,
    rejectVerificationRequest,
    getAdminPosts,
    deleteAdminPost
};
