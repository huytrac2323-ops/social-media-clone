const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// SỬA LỖI: Thêm options.useUTC = false để đảm bảo Unicode được xử lý đúng
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        useUTC: false // Bắt buộc driver xử lý đúng kiểu NVarChar
    }
};

const tablesToDrop = [
    'comment_likes', 'post_likes', 'post_tags', 'hashtag_follow',
    'bookmarks', 'login', 'comments', 'follows', 'post',
    'photos', 'videos', 'users', 'hashtags'
];

const createSchemaSQL = `
    CREATE TABLE users (
        user_id INT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        profile_photo_url VARCHAR(255),
        bio NVARCHAR(255),
        created_at DATETIME DEFAULT GETDATE()
    );
    CREATE TABLE post (
        post_id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        caption NVARCHAR(MAX),
        photo_url VARCHAR(255),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
    CREATE TABLE comments (
        comment_id INT IDENTITY(1,1) PRIMARY KEY,
        comment_text NVARCHAR(255) NOT NULL,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY(post_id) REFERENCES post(post_id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(user_id)
    );
    CREATE TABLE post_likes (
        user_id INT NOT NULL,
        post_id INT NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY(user_id) REFERENCES users(user_id),
        FOREIGN KEY(post_id) REFERENCES post(post_id),
        PRIMARY KEY(user_id, post_id)
    );
    CREATE TABLE follows (
        follower_id INT NOT NULL,
        followee_id INT NOT NULL,
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY(follower_id) REFERENCES users(user_id),
        FOREIGN KEY(followee_id) REFERENCES users(user_id),
        PRIMARY KEY(follower_id, followee_id)
    );
`;

const seedSQL = `
    INSERT INTO users (username, email, password_hash, bio) VALUES ('tracnhathuy', 'huy@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IscglcEM0nFSb2lOcs.OTFF8IoiC2', N'Xin chào, đây là tiểu sử của tôi!');
    INSERT INTO users (username, email, password_hash, bio) VALUES ('nguyenvana', 'vana@example.com', '$2b$10$N9qo8uLOickgx2ZMRZoMye.IscglcEM0nFSb2lOcs.OTFF8IoiC2', N'Một người dùng khác.');
    INSERT INTO post (user_id, caption) VALUES (1, N'Chào mừng đến với mạng xã hội! Đây là bài viết đầu tiên có dấu.');
    INSERT INTO comments (post_id, user_id, comment_text) VALUES (1, 2, N'Bình luận này cũng có dấu tiếng Việt.');
`;

async function resetDatabaseTables() {
    let pool;
    try {
        console.log("Đang kết nối vào database '" + dbConfig.database + "'...");
        pool = await sql.connect(dbConfig);
        console.log('Kết nối thành công.');

        console.log('--- BƯỚC 1: Đang xóa các bảng cũ ---');
        for (const table of tablesToDrop) {
            try {
                await pool.request().query('DROP TABLE IF EXISTS ' + table);
                console.log('- Đã xóa bảng: ' + table);
            } catch (err) { /* Bỏ qua lỗi */ }
        }
        console.log('Đã dọn dẹp xong.');

        console.log('\n--- BƯỚC 2: Đang tạo lại các bảng với cấu trúc mới ---');
        const createCommands = createSchemaSQL.split(';').filter(cmd => cmd.trim().length > 0);
        for (const command of createCommands) {
            await pool.request().query(command);
        }
        console.log('Đã tạo lại các bảng thành công.');

        console.log('\n--- BƯỚC 3: Đang thêm dữ liệu mẫu ---');
        const seedCommands = seedSQL.split(';').filter(cmd => cmd.trim().length > 0);
        for (const command of seedCommands) {
            await pool.request().query(command);
        }
        console.log('Đã thêm dữ liệu mẫu thành công.');

        await pool.close();
        console.log('\n✅ ✅ ✅ QUÁ TRÌNH LÀM MỚI DATABASE ĐÃ HOÀN TẤT! ✅ ✅ ✅');

    } catch (err) {
        console.error('\n❌ ❌ ❌ ĐÃ XẢY RA LỖI:', err.message);
        if (pool) {
            await pool.close();
        }
    }
}

resetDatabaseTables();