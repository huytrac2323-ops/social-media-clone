const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
// Thêm import poolPromise từ db.js
const { poolPromise } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');


const corsOptions = {
    // Đưa cả 2 đường link vào một mảng (Lưu ý: Không có dấu / ở cuối link)
    origin: [
        'http://localhost:5173',
        'https://social-media-frontend-brxn.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};




// 3. STATIC FILES
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors(corsOptions));


// 4. ROUTESapp.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api', userRoutes);
app.use(express.static('public'));


// 5. KHỞI ĐỘNG SERVER
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