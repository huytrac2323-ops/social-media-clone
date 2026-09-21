const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ LỖI: Chưa cấu hình biến DATABASE_URL trong file backend/.env!");
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initSupabaseDatabase() {
    console.log("⏳ Đang kết nối tới Supabase / PostgreSQL...");
    let client;
    try {
        client = await pool.connect();
        console.log("✅ Kết nối Database thành công!");

        const schemaPath = path.resolve(__dirname, '../supabase_schema.sql');
        if (!fs.existsSync(schemaPath)) {
            console.error(`❌ Không tìm thấy file schema tại: ${schemaPath}`);
            return;
        }

        const sqlContent = fs.readFileSync(schemaPath, 'utf-8');
        console.log("🚀 Đang khởi tạo các bảng và dữ liệu mẫu từ supabase_schema.sql...");
        
        await client.query(sqlContent);

        console.log("🎉 KHỞI TẠO DATABASE SUPABASE THÀNH CÔNG RỰC RỠ! 🎉");
        console.log("Tất cả các bảng và quan hệ khóa ngoại đã sẵn sàng hoạt động.");
    } catch (err) {
        console.error("❌ ĐÃ XẢY RA LỖI KHI KHỞI TẠO DATABASE:", err.message);
        if (err.message.includes('password authentication failed')) {
            console.error("👉 Gợi ý: Hãy kiểm tra lại mật khẩu Database trong DATABASE_URL.");
        } else if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
            console.error("👉 Gợi ý: Hãy kiểm tra lại địa chỉ host của Supabase hoặc sử dụng Connection Pooler URI (port 6543 / 5432).");
        }
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

initSupabaseDatabase();