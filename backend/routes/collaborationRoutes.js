const express = require('express');
const router = express.Router();
const {
    getCollaborations,
    createCollaboration,
    updateCollaborationStatus
} = require('../controllers/collaborationController');

router.get('/', getCollaborations);
router.post('/', createCollaboration);
router.patch('/:id/status', updateCollaborationStatus);

module.exports = router;
