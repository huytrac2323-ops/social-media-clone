const express = require('express');
const upload = require('../middlewares/upload');
const { createStory, getStories, viewStory, reactToStory } = require('../controllers/storyController');

const router = express.Router();
router.get('/', getStories);
router.post('/', upload.single('storyMedia'), createStory);
router.post('/:storyId/view', viewStory);
router.post('/:storyId/react', reactToStory);

module.exports = router;
