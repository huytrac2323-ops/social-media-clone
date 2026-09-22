const { pool } = require('../config/db');

// Gửi yêu cầu xin cấp tích xanh
const submitRequest = async (req, res) => {
    const userId = req.user?.id;
    const { full_name, creator_type, portfolio_url, reason, document_url } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập để gửi yêu cầu.' });
    }

    if (!full_name || !full_name.trim()) {
        return res.status(400).json({ message: 'Vui lòng cung cấp họ và tên thật hoặc nghệ danh của bạn.' });
    }

    if (!reason || !reason.trim()) {
        return res.status(400).json({ message: 'Vui lòng cung cấp lý do hoặc thành tích xin cấp tích xanh.' });
    }

    try {
        // Kiểm tra xem user có đang có đơn chờ duyệt (pending) không
        const checkPending = await pool.query(
            "SELECT request_id, created_at FROM verification_requests WHERE user_id = $1 AND status = 'pending' LIMIT 1",
            [userId]
        );

        if (checkPending.rows.length > 0) {
            return res.status(400).json({
                message: 'Bạn đã có một yêu cầu cấp tích xanh đang chờ duyệt. Vui lòng đợi quản trị viên phản hồi.',
                existingRequest: checkPending.rows[0]
            });
        }

        // Tạo yêu cầu mới
        const insertResult = await pool.query(
            `INSERT INTO verification_requests (user_id, full_name, creator_type, portfolio_url, reason, document_url, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')
             RETURNING *`,
            [
                userId,
                full_name.trim(),
                creator_type ? creator_type.trim() : null,
                portfolio_url ? portfolio_url.trim() : null,
                reason.trim(),
                document_url ? document_url.trim() : null
            ]
        );

        // Đồng thời cập nhật creator_type trong bảng users nếu user cung cấp
        if (creator_type && creator_type.trim()) {
            await pool.query(
                `UPDATE users SET creator_type = $1 WHERE user_id = $2 AND (creator_type IS NULL OR creator_type = '')`,
                [creator_type.trim(), userId]
            );
        }

        res.status(201).json({
            message: 'Đã gửi yêu cầu cấp tích xanh thành công! Ban quản trị sẽ xét duyệt sớm nhất.',
            request: insertResult.rows[0]
        });
    } catch (err) {
        console.error('Lỗi khi gửi yêu cầu tích xanh:', err);
        res.status(500).json({ message: 'Lỗi server khi gửi yêu cầu tích xanh.', error: err.message });
    }
};

// Lấy thông tin yêu cầu mới nhất của người dùng hiện tại
const getMyRequest = async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập.' });
    }

    try {
        const result = await pool.query(
            `SELECT * FROM verification_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        res.status(200).json({
            request: result.rows.length > 0 ? result.rows[0] : null
        });
    } catch (err) {
        console.error('Lỗi khi lấy yêu cầu tích xanh của tôi:', err);
        res.status(500).json({ message: 'Lỗi server.', error: err.message });
    }
};

module.exports = {
    submitRequest,
    getMyRequest
};
