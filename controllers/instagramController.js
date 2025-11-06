const axios = require('axios');
const User = require('../models/User');
const { refreshToken } = require('./authController');

// Check if token needs refresh
const ensureValidToken = async (user) => {
  const now = new Date();
  const daysUntilExpiry = (user.tokenExpiry - now) / (1000 * 60 * 60 * 24);

  // Refresh if less than 7 days remaining
  if (daysUntilExpiry < 7) {
    console.log('Token expiring soon, refreshing...');
    await refreshToken(user.instagramUserId);
    return await User.findOne({ instagramUserId: user.instagramUserId });
  }

  return user;
};

// Publish single image to Instagram
exports.publishPhoto = async (req, res) => {
  const { userId, imageUrl, caption, accessToken } = req.body;

  if (!userId || !imageUrl || !caption) {
    return res.status(400).json({
      error: 'Missing required fields: userId, imageUrl, caption',
    });
  }

  try {
    // DEBUG: Check database retrieval
    console.log('=== Publish Photo Debug ===');
    console.log('Looking for user ID:', userId);
    
    let user = await User.findOne({ instagramUserId: userId });

    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ User found:', user.username);
    console.log('Access token stored:', user.accessToken.substring(0, 50) + '...');
    console.log('Token expiry:', user.tokenExpiry);
    console.log('===========================');

    // Ensure token is valid
    user = await ensureValidToken(user);

    // Step 1: Create media container
    const createMediaResponse = await axios.post(
      `https://graph.facebook.com/v20.0/${userId}/media`,
      {
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken, // Use passed token
      }
    );

    const creationId = createMediaResponse.data.id;

    // Step 2: Publish media container
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v20.0/${user.instagramUserId}/media_publish`,
      {
        creation_id: creationId,
        access_token: user.accessToken,
      }
    );

    user.lastPostAt = new Date();
    await user.save();

    console.log('✅ Photo published successfully');

    res.json({
      success: true,
      message: 'Photo published successfully',
      postId: publishResponse.data.id,
    });
  } catch (error) {
      console.error(error.response?.data || error.message);
      res.status(500).json({
        error: 'Failed to publish photo',
        details: error.response?.data || error.message,
      });
    
    // res.status(500).json({
    //   error: 'Failed to publish photo',
    //   details: error.response?.data || error.message,
    // });
  }
};



// Publish video/reel to Instagram
exports.publishVideo = async (req, res) => {
  const { userId, videoUrl, caption, coverUrl } = req.body;

  if (!userId || !videoUrl || !caption) {
    return res.status(400).json({
      error: 'Missing required fields: userId, videoUrl, caption',
    });
  }

  try {
    let user = await User.findOne({ instagramUserId: userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user = await ensureValidToken(user);

    // Create video container
    const createVideoResponse = await axios.post(
      `https://graph.facebook.com/v20.0/${user.instagramUserId}/media`,
      {
        media_type: 'REELS',
        video_url: videoUrl,
        caption: caption,
        cover_url: coverUrl,
        access_token: user.accessToken,
      }
    );

    const creationId = createVideoResponse.data.id;

    // Check video processing status
    let status = 'IN_PROGRESS';
    let attempts = 0;
    const maxAttempts = 30;

    while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds

      const statusResponse = await axios.get(
        `https://graph.facebook.com/v20.0/${creationId}?fields=status_code&access_token=${user.accessToken}`
      );

      status = statusResponse.data.status_code;
      attempts++;
    }

    if (status !== 'FINISHED') {
      return res.status(500).json({
        error: 'Video processing failed or timed out',
        status: status,
      });
    }

    // Publish video
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v20.0/${user.instagramUserId}/media_publish`,
      {
        creation_id: creationId,
        access_token: user.accessToken,
      }
    );

    user.lastPostAt = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Video published successfully',
      postId: publishResponse.data.id,
    });
  } catch (error) {
    console.error('Video Publish Error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to publish video',
      details: error.response?.data || error.message,
    });
  }
};

// Get user's connected accounts
exports.getConnectedAccounts = async (req, res) => {
  try {
    const users = await User.find({}, '-accessToken');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
