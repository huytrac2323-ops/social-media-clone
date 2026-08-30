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



// 2. Cấu hình CORS cho phép mọi nguồn (hoặc định nghĩa cụ thể)
const corsOptions = {
    origin: '*', // Cho phép mọi nguồn gọi vào (Thích hợp cho việc test app mobile và web)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

app.use(cors({ origin: '*' }));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public'));
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



let query = `
    SELECT p.post_id, p.caption, p.photo_url, p.created_at, u.user_id, u.username, u.profile_photo_url,
    (SELECT COUNT(*) FROM post_reactions pr WHERE pr.post_id = p.post_id) AS like_count,
    EXISTS (SELECT 1 FROM post_reactions pr WHERE pr.post_id = p.post_id AND pr.user_id = $1) AS is_liked_by_user
    FROM post p JOIN users u ON p.user_id = u.user_id
    WHERE p.user_id = $1 
       OR p.user_id IN (SELECT friend_id FROM friends WHERE user_id = $1 AND status = 'accepted') 
       OR p.user_id IN (SELECT user_id FROM friends WHERE friend_id = $1 AND status = 'accepted')
    ORDER BY p.created_at DESC
`;





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
app.get('/api/suggestions/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const query = `
            SELECT user_id, username, profile_photo_url FROM users 
            WHERE user_id != $1 
            AND user_id NOT IN (SELECT friend_id FROM friends WHERE user_id = $1)
            AND user_id NOT IN (SELECT user_id FROM friends WHERE friend_id = $1)
            LIMIT 5;
        `;
        const result = await pool.query(query, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/// Thêm API này vào server.js của backend
app.post('/api/friends/request', async (req, res) => {
    const { user_id, friend_id } = req.body;
    try {
        await pool.query(
            'INSERT INTO friends (user_id, friend_id, status) VALUES ($1, $2, \'pending\') ON CONFLICT DO NOTHING',
            [user_id, friend_id]
        );
        res.status(200).json({ message: "Đã gửi yêu cầu kết bạn!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/friends/accept', async (req, res) => {
    const { user_id, friend_id } = req.body;
    try {
        await pool.query(
            'UPDATE friends SET status = \'accepted\' WHERE user_id = $2 AND friend_id = $1',
            [user_id, friend_id]
        );
        res.status(200).json({ message: "Đã chấp nhận kết bạn!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/friends/remove', async (req, res) => {
    const { user_id, friend_id } = req.body;
    try {
        await pool.query(
            'DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
            [user_id, friend_id]
        );
        res.status(200).json({ message: "Đã hủy kết bạn!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
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


// 4. Cấu hình Socket.io CORS tương ứng

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép mọi kết nối Socket từ di động hoặc web
        methods: ["GET", "POST"]
    }
});

// Xử lý sự kiện Chat Real-time và lưu vào PostgreSQL
io.on('connection', (socket) => {
    console.log(`⚡ Một người dùng vừa kết nối Socket: ${socket.id}`);

    socket.on('send_message', async (data) => {
        try {
            // 👇 IN DÒNG NÀY RA ĐỂ KIỂM TRA XEM REACT CÓ GỬI ĐÚNG ID KHÔNG
            console.log("Dữ liệu nhận từ Client:", data);

            if (!data.sender_id || !data.receiver_id || !data.message_text) {
                console.error("❌ Thiếu thông tin gửi tin nhắn (sender_id, receiver_id hoặc message_text)!");
                return;
            }

            const result = await pool.query(
                'INSERT INTO messages (sender_id, receiver_id, message_text) VALUES ($1, $2, $3) RETURNING *',
                [data.sender_id, data.receiver_id, data.message_text]
            );

            const savedMessage = result.rows[0];
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