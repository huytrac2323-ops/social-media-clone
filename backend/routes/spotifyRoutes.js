const express = require('express');
const { searchSpotifyTracks } = require('../controllers/spotifyController');

const router = express.Router();
router.get('/search', searchSpotifyTracks);

module.exports = router;
