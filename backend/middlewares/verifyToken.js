const jwt = require('jsonwebtoken');
const { pool } = require('../config/db'); // Import kết nối database để check blacklist

const verifyToken = async (req, res, next) => {
    // 1. Lấy token từ header (thường có dạng "Bearer <chuỗi_token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện chức năng này.' });
    }

    try {
        // 2. Kiểm tra token đã đưa vào danh sách đen chưa (Sửa lại đúng tên bảng, đúng query và dùng $1)
        const checkBlacklist = await pool.query('SELECT * FROM token_blacklist WHERE token = $1', [token]);
        if (checkBlacklist.rows.length > 0) {
            return res.status(401).json({ message: 'Phiên làm việc đã kết thúc (Token đã bị hủy).' });
        }

        // 3. Giải mã token (Sử dụng chuỗi Secret Key giống hệt lúc bạn tạo token khi Login)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chuoi_bi_mat_cua_ban');

        // 4. Gán thông tin giải mã được vào object `req` để truyền sang Controller
        req.user = decoded;

        next(); // Cho phép đi tiếp vào Controller
    } catch (err) {
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};

module.exports = verifyToken;