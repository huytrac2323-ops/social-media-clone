// File: routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// 1. Tạo link thanh toán VNPAY (chuyển hướng người dùng sang cổng thanh toán VNPAY)
router.post('/create-payment-url', paymentController.createPaymentUrl);

// 2. Xác minh chữ ký số và kết quả giao dịch trả về từ VNPAY (gọi từ frontend /payment/result)
router.post('/vnpay-verify', paymentController.vnpayVerify);

// 3. Webhook IPN nhận kết quả thanh toán từ máy chủ VNPAY
router.get('/vnpay-ipn', paymentController.vnpayIpn);

// 4. Kích hoạt thử nghiệm nhanh trong môi trường Sandbox (Test Sandbox Instant)
router.post('/test-sandbox-activate', paymentController.testSandboxActivate);

// 5. Đẩy bài viết lên Top bảng tin (Post Boost)
router.post('/boost-post/:postId', paymentController.boostPost);

// 6. Kiểm tra trạng thái gói VIP và số lượt boost của người dùng
router.get('/vip-status/:userId', paymentController.getVipStatus);

module.exports = router;
