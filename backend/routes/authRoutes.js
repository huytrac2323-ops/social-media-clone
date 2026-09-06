// File: routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/verifyToken'); // 👈 Thêm dòng này để nạp middleware vào file

// Xử lý các route bắt đầu bằng /api/auth (sẽ cấu hình ở server.js)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout); // 👈 Thêm route đăng xuất
router.delete('/account/:userId', verifyToken, authController.deleteAccount);
module.exports = router;