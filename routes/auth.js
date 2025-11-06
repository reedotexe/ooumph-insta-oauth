const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// These routes will be available at /auth/instagram and /auth/instagram/callback
router.get('/instagram', authController.initiateAuth);
router.get('/instagram/callback', authController.handleCallback);

// module.exports = router;


// Handle deauthorization callback from Instagram
router.post('/instagram/deauthorize', async (req, res) => {
  console.log('Deauthorize callback received:', req.body);
  
  // Instagram sends user_id when user revokes access
  const { signed_request } = req.body;
  
  // TODO: Parse signed_request and delete user's tokens from database
  // For now, just acknowledge receipt
  
  res.status(200).json({ success: true });
});


module.exports = router;
