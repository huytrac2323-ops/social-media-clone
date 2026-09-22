const { pool } = require('../config/db');

const verifyAdmin = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
        }

        const result = await pool.query(
            'SELECT role, is_banned FROM users WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Người dùng không tồn tại.' });
        }

        const user = result.rows[0];

        if (user.is_banned) {
            return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa.' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Truy cập bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền truy cập.' });
        }

        next();
    } catch (err) {
        console.error('Lỗi kiểm tra quyền Admin:', err);
        return res.status(500).json({ message: 'Lỗi server khi xác thực quyền quản trị.', error: err.message });
    }
};

module.exports = verifyAdmin;
