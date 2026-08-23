const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
// Thêm import poolPromise từ db.js
const { poolPromise } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');

// Cho phép người ngoài truy cập vào thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
// CẤU HÌNH CORS ĐÚNG CÁCH CHO RENDER:
app.use(cors({
    // Điền đúng cái link Frontend của bạn vào đây (Lưu ý: Không có dấu / ở cuối)
    origin: 'https://social-media-frontend-brxn.onrender.com',
    credentials: true, // Nếu API của bạn có dùng cookie/session thì cần cái này
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));


// Nạp các Routes
app.use('/api/auth', authRoutes);
// Bổ sung nạp các routes còn thiếu
app.use('/api/posts', postRoutes);
app.use('/api', userRoutes);

app.use(express.static('public'));

const startServer = async () => {
    try {
        await poolPromise;
        const port = process.env.PORT || 5000;
        app.listen(port, () => console.log(`✅ Server web đang chạy trên cổng ${port}`));
    } catch (err) {
        console.error("❌ SERVER KHÔNG THỂ KHỞI ĐỘNG.", err);
    }
};

startServer();