const { pool } = require('./config/db'); // hoặc './db' tùy vị trí thực tế
const express = require('express');
const http = require('http'); // ⚠️ Bắt buộc phải có để chạy Socket.io
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');

require('dotenv').config();



// Khởi tạo Express app
const app = express();

// 1. IMPORT CONTROLLERS & DB
const { poolPromise } = require('./config/db'); //const { savePost, unsavePost } = require('./controllers/savedPostController');
const { getNotifications } = require('./controllers/NotificationController');
const { getMessages } = require('./controllers/messageController');

// Import các Routes cũ của bạn
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');
const {savePost, unsavePost} = require("./controllers/SavedPostController");

// 2. CẤU HÌNH CORS
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'https://social-media-frontend-brxn.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public'));

// 3. ĐĂNG KÝ CÁC ROUTES
app.use('/api/friends', friendRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', userRoutes);

// --- CÁC API MỚI CHO TÍNH NĂNG LƯU BÀI & THÔNG BÁO & CHAT ---
app.post('/api/posts/:postId/save', savePost);
app.delete('/api/posts/:postId/unsave', unsavePost);
app.get('/api/notifications/:userId', getNotifications);
app.get('/api/messages/:userId/:friendId', async (req, res) => {
    const { userId, friendId } = req.params;
    try {
        const result = await pool.query(
            `SELECT * FROM messages 
             WHERE (sender_id = $1 AND receiver_id = $2) 
                OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at ASC`,
            [userId, friendId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("CHI TIẾT LỖI SQL GET MESSAGES:", error.message); // 👈 In lỗi ra terminal
        res.status(500).json({ error: "Lỗi Server", details: error.message });
    }
});
/// Thêm API này vào server.js của backend
app.post('/api/messages', async (req, res) => {
    const { sender_id, receiver_id, message_text } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO messages (sender_id, receiver_id, message_text)
             VALUES ($1, $2, $3) RETURNING *`,
            [sender_id, receiver_id, message_text]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Lỗi gửi tin nhắn:", error.message);
        res.status(500).json({ error: "Lỗi Server" });
    }
});

app.get('/api/conversations/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const result = await pool.query(
            `SELECT DISTINCT u.user_id, u.username, u.profile_photo_url 
             FROM users u 
             JOIN messages m ON u.user_id = m.sender_id OR u.user_id = m.receiver_id 
             WHERE (m.sender_id = $1 OR m.receiver_id = $1) AND u.user_id != $1`,
            [userId]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Lỗi lấy danh sách trò chuyện:", error.message);
        res.status(500).json({ error: "Lỗi Server" });
    }
});



// 4. TẠO HTTP SERVER & TÍCH HỢP SOCKET.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Xử lý sự kiện Chat Real-time và lưu vào PostgreSQL
io.on('connection', (socket) => {
    console.log(`⚡ Một người dùng vừa kết nối Socket: ${socket.id}`);

    socket.on('send_message', async (data) => {
        try {
            // 1. Đã sửa tên cột: content -> message_text
            // 2. Dùng RETURNING * để lấy chính xác mọi cột tự động (bao gồm id và created_at)
            const result = await pool.query(
                'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES ($1, $2, $3) RETURNING *',
                [data.sender_id, data.receiver_id, data.message_text]
            );

            // Gán luôn object tin nhắn hoàn chỉnh vừa được Database tạo ra
            const savedMessage = result.rows[0];

            // 3. Phát tin nhắn chuẩn xác đến các client
            io.emit('receive_message', savedMessage);
        } catch (error) {
            console.error("❌ Lỗi khi lưu tin nhắn Socket vào DB:", error.message);
        }
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Người dùng đã ngắt kết nối: ${socket.id}`);
    });
});


// 5. KHỞI ĐỘNG SERVER & KIỂM TRA KẾT NỐI DB
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Kiểm tra kết nối database trước khi mở cổng server
        const client = await pool.connect();
        console.log("✅ Kết nối Database PostgreSQL thành công!");
        client.release();

        server.listen(PORT, () => {
            console.log(`🚀 Server web đang chạy trên cổng ${PORT}`);
        });
    } catch (err) {
        console.error("❌ SERVER KHÔNG THỂ KHỞI ĐỘNG DO LỖI DB:", err);
    }
};

startServer();