const express = require('express');
const router = express.Router();
const instagramController = require('../controllers/instagramController');

// Publish photo
router.post('/publish/photo', instagramController.publishPhoto);

// Publish video/reel
router.post('/publish/video', instagramController.publishVideo);

// Get connected accounts
router.get('/accounts', instagramController.getConnectedAccounts);

module.exports = router;
