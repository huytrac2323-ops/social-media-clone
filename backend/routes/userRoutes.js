// File: routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../middlewares/upload'); // Import middleware multer


// Các API cho Users
router.get('/users', userController.getUsers);
router.get('/users/:username', userController.getUserByUsername);

// Các API cho Profile
router.patch('/profile', userController.updateProfile);
router.post('/profile/avatar', upload.single('avatar'), userController.updateAvatar);
router.post('/profile/contact/send-otp', userController.sendContactOtp);
router.post('/profile/contact/verify-otp', userController.verifyContactOtp);
router.post('/profile/toggle-open-for-collab', userController.toggleOpenForCollab);

module.exports = router;