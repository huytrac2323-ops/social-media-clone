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
        // 2.kiểm tra token đưa vào ds đen chưa
        const checkBlackist = await pool.querry('SELECT * FROM token_blackist WHERE token =&1',[token]);
        if (checkBlackist.rows.length >0){
            return res.status(401).json({ message: 'phiên bản này đã kết thúc (Token bị hủy'});
        }
        // 3. Giải mã token (Sử dụng chuỗi Secret Key giống hệt lúc bạn tạo token khi Login)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'chuoi_bi_mat_cua_ban');

        // 4. Gán thông tin giải mã được vào object `req` để truyền sang Controller
        req.user = decoded;

        next(); // Cho phép đi tiếp vào hàm sharePost
    } catch (err) {
        return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};

module.exports = verifyToken;