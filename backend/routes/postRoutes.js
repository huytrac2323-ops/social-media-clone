// File: routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const upload = require('../middlewares/upload');
const verifyToken = require('../middlewares/verifyToken');
const { savePost, unsavePost, getSavedPosts } = require('../controllers/SavedPostController');


router.patch('/:postId', postController.updatePost);
router.delete('/:postId', postController.deletePost);

router.post('/:postId/like', postController.likePost);
router.post('/:postId/comment', postController.commentPost);
router.post('/:postId/share', verifyToken, postController.sharePost);
router.post('/', upload.single('postImage'), postController.createPost);
router.post('/:postId/save', savePost);
router.get('/saved/:userId', getSavedPosts);
router.get('/saved-posts/:userId', getSavedPosts);

router.get('/', postController.getPosts);
router.get('/:postId', postController.getPostById);


// Nếu getMessages và getNotifications chưa có trong postController, bạn cần định nghĩa chúng hoặc tạm thời ẩn đi nếu chưa dùng đến
// router.get('/api/messages/:friendId', verifyToken, postController.getMessages);
// router.get('/api/notifications/:userId', verifyToken, postController.getNotifications);

module.exports = router;
