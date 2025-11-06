const axios = require('axios');
const FormData = require('form-data');
const User = require('../models/User');

exports.initiateAuth = (req, res) => {
  const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${process.env.INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(process.env.INSTAGRAM_REDIRECT_URI)}&response_type=code&scope=instagram_business_basic,instagram_business_content_publish,instagram_business_manage_messages,instagram_business_manage_comments`;
  
  console.log('=== OAuth Debug Info ===');
  console.log('Client ID:', process.env.INSTAGRAM_APP_ID);
  console.log('Redirect URI:', process.env.INSTAGRAM_REDIRECT_URI);
  console.log('Full Auth URL:', authUrl);
  console.log('=======================');
  
  res.redirect(authUrl);
};

exports.handleCallback = async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('Authorization Error:', error, error_description);
    return res.status(400).json({ 
      error: error, 
      description: error_description 
    });
  }

  if (!code) {
    return res.status(400).json({ error: 'Authorization code not provided' });
  }

  console.log('=== Token Exchange Debug ===');
  console.log('Authorization code received:', code);
  console.log('Redirect URI from env:', process.env.INSTAGRAM_REDIRECT_URI);
  console.log('Actual request path:', req.path);
  console.log('Actual full path:', req.originalUrl);
  console.log('===========================');

  try {
    const FormData = require('form-data');
    const formData = new FormData();
    
    formData.append('client_id', process.env.INSTAGRAM_APP_ID);
    formData.append('client_secret', process.env.INSTAGRAM_APP_SECRET);
    formData.append('grant_type', 'authorization_code');
    // Use EXACTLY what's in .env file
    formData.append('redirect_uri', process.env.INSTAGRAM_REDIRECT_URI);
    formData.append('code', code);

    console.log('Sending token exchange with redirect_uri:', process.env.INSTAGRAM_REDIRECT_URI);

    const tokenResponse = await axios.post(
      'https://api.instagram.com/oauth/access_token',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    console.log('✅ Token response received:', tokenResponse.data);

    const { access_token, user_id } = tokenResponse.data;

    // Exchange for long-lived token (60 days)
    console.log('Exchanging for long-lived token...');
    const longLivedTokenResponse = await axios.get(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${access_token}`
    );

    const longLivedToken = longLivedTokenResponse.data.access_token;
    const expiresIn = longLivedTokenResponse.data.expires_in;

    console.log('✅ Long-lived token received, expires in:', expiresIn, 'seconds');

    // Get user profile info
    const userInfo = await axios.get(
      `https://graph.instagram.com/me?fields=user_id,username,account_type&access_token=${longLivedToken}`
    );

    console.log('✅ User info retrieved:', userInfo.data);

    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    // Save to database
    const savedUser = await User.findOneAndUpdate(
      { instagramUserId: user_id },
      {
        instagramUserId: user_id,
        username: userInfo.data.username,
        accessToken: longLivedToken,
        tokenExpiry: tokenExpiry,
      },
      { upsert: true, new: true }
    );

    console.log('✅ User saved to database:', savedUser.username);

    res.json({
      success: true,
      message: 'Instagram account connected successfully! 🎉',
      user: {
        id: user_id,
        username: userInfo.data.username,
        accountType: userInfo.data.account_type,
        tokenExpiry: tokenExpiry,
      },
    });

  } catch (error) {
    console.error('=== Auth Error Details ===');
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('========================');
    
    res.status(500).json({
      error: 'Authentication failed',
      details: error.response?.data || error.message,
    });
  }
};

exports.refreshToken = async (userId) => {
  try {
    const user = await User.findOne({ instagramUserId: userId });
    
    if (!user) {
      throw new Error('User not found');
    }

    const refreshResponse = await axios.get(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${user.accessToken}`
    );

    const newToken = refreshResponse.data.access_token;
    const expiresIn = refreshResponse.data.expires_in;
    const newExpiry = new Date(Date.now() + expiresIn * 1000);

    user.accessToken = newToken;
    user.tokenExpiry = newExpiry;
    await user.save();

    return newToken;
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    throw error;
  }
};
