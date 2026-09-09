const express = require('express');
const upload = require('../middlewares/upload');
const { createStory, getStories, viewStory, reactToStory, updateStory, deleteStory } = require('../controllers/storyController');

const router = express.Router();
router.get('/', getStories);
router.post('/', upload.fields([
    { name: 'storyMedia', maxCount: 1 },
    { name: 'storyMusic', maxCount: 1 }
]), createStory);
router.patch('/:storyId', upload.fields([
    { name: 'storyMedia', maxCount: 1 },
    { name: 'storyMusic', maxCount: 1 }
]), updateStory);
router.put('/:storyId', upload.fields([
    { name: 'storyMedia', maxCount: 1 },
    { name: 'storyMusic', maxCount: 1 }
]), updateStory);
router.delete('/:storyId', deleteStory);
router.post('/:storyId/view', viewStory);
router.post('/:storyId/react', reactToStory);

module.exports = router;
