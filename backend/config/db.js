const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Sử dụng Connection String (External Database URL từ Render) hoặc các biến rời
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Hoặc dùng các biến host, user, password, database riêng lẻ
    ssl: {
        rejectUnauthorized: false // Bắt buộc khi kết nối database cloud trên Render
    }
});

pool.connect()
    .then(() => console.log("✅ Kết nối PostgreSQL trên Render thành công!"))
    .catch(err => console.error("❌ Lỗi kết nối PostgreSQL:", err));

module.exports = pool;