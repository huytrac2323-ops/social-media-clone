// File: config/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Khởi tạo pool một lần duy nhất
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Hoặc nếu bạn dùng cấu hình thông số riêng lẻ:
    // host: process.env.DB_HOST,
    // user: process.env.DB_USER,
    // password: process.env.DB_PASSWORD,
    // database: process.env.DB_NAME,
    // port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false // Cần thiết nếu dùng database online như Render/Supabase
    }
});

// Xuất ra dạng object hoặc biến trực tiếp tùy ý bạn chọn (ở đây chọn export object cho an toàn)
module.exports = { pool };