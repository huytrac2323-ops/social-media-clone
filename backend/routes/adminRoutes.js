const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const verifyAdmin = require('../middlewares/verifyAdmin');
const {
    getAdminStats,
    getAdminUsers,
    toggleVerifyUser,
    toggleBanUser,
    updateUserRole,
    getVerificationRequests,
    approveVerificationRequest,
    rejectVerificationRequest,
    getAdminPosts,
    deleteAdminPost
} = require('../controllers/adminController');

// Tất cả các routes admin đều qua verifyToken và verifyAdmin
router.use(verifyToken, verifyAdmin);

// Thống kê
router.get('/stats', getAdminStats);

// Quản lý người dùng
router.get('/users', getAdminUsers);
router.patch('/users/:userId/verify', toggleVerifyUser);
router.patch('/users/:userId/ban', toggleBanUser);
router.patch('/users/:userId/role', updateUserRole);

// Xét duyệt Tích Xanh
router.get('/verification-requests', getVerificationRequests);
router.post('/verification-requests/:requestId/approve', approveVerificationRequest);
router.post('/verification-requests/:requestId/reject', rejectVerificationRequest);

// Quản lý bài viết
router.get('/posts', getAdminPosts);
router.delete('/posts/:postId', deleteAdminPost);

module.exports = router;
