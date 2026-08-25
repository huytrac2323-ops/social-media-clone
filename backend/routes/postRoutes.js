// File: routes/postRoutes.js
const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const upload = require('../middlewares/upload');
const verifyToken = require('../middlewares/verifyToken');


router.get('/', postController.getPosts);
router.get('/:postId', postController.getPostById);
router.post('/', upload.single('postImage'), postController.createPost);
router.patch('/:postId', postController.updatePost);
router.delete('/:postId', postController.deletePost);
router.post('/:postId/like', postController.likePost);
router.post('/:postId/comment', postController.commentPost);
router.post('/:postId/share', verifyToken, postController.sharePost);
module.exports = router;