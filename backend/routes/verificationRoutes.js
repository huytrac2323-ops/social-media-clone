const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyToken');
const { submitRequest, getMyRequest } = require('../controllers/verificationController');

router.post('/request', verifyToken, submitRequest);
router.get('/my-request', verifyToken, getMyRequest);

module.exports = router;
