const express = require('express');
const { search, getCreators, updateCreatorType } = require('../controllers/exploreController');

const router = express.Router();
router.get('/search', search);
router.get('/creators', getCreators);
router.post('/creators/type', updateCreatorType);

module.exports = router;
