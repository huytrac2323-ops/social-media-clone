const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');

// Route Gửi lời mời kết bạn (POST)
router.post('/request', friendController.sendFriendRequest);

// Route Chấp nhận lời mời (PUT hoặc PATCH)
router.patch('/accept', friendController.acceptFriendRequest);

// Route Hủy kết bạn hoặc Từ chối (DELETE)
router.delete('/unfriend', friendController.unfriendOrReject);

// Route Lấy danh sách bạn bè (GET)
router.get('/:user_id/list', friendController.getFriendsList);
// Thêm dòng này vào friendRoutes.js
router.get('/status/:user1/:user2', friendController.checkFriendStatus);
module.exports = router;