// File: controllers/authController.js
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

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
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send({ message: 'Vui lòng điền email và mật khẩu.' });

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) return res.status(401).send({ message: 'Email hoặc mật khẩu không chính xác.' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).send({ message: 'Email hoặc mật khẩu không chính xác.' });

        const { password_hash, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

module.exports = { register, login };