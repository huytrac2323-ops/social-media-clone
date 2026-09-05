// File: controllers/authController.js
const { pool } = require('../config/db'); // 👈 Đúng
const jwt = require('jsonwebtoken'); // Nhớ khai báo cái này ở đầu file nếu chưa có
const bcrypt = require('bcryptjs');

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
const logout = async (req,res)=>{
    try{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer')){
            return res.status(400).json({ message:'ko tìm thấy toekn hợp lệ'})
        }
        const token = authHeader.split('')[1];
        await pool.query('INSERT INTO token_blacklist (token) VALUES ($1)' , [token])

        res.status(200).json ({message: "đăng xuất thành công!"});
    }
    catch(error){
        res.status(500).json({message:"lỗi server khi đăng xuất",error:error.message});
    }

}

module.exports = { register, login,logout };