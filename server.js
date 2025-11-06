require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const instagramRoutes = require('./routes/instagram');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CRITICAL: Make sure auth routes are mounted at /auth prefix
app.use('/auth', authRoutes);  // This makes routes available at /auth/*
app.use('/api/instagram', instagramRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Instagram Automation API - HTTPS Enabled',
    endpoints: {
      auth: 'https://localhost:3000/auth/instagram',
      callback: 'https://localhost:3000/auth/instagram/callback', // This should match
      publish_photo: 'POST https://localhost:3000/api/instagram/publish/photo',
      publish_video: 'POST https://localhost:3000/api/instagram/publish/video',
      accounts: 'GET https://localhost:3000/api/instagram/accounts',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

// Load SSL certificate and key
const httpsOptions = {
  key: fs.readFileSync(process.env.SSL_KEY_PATH || './certs/localhost-key.pem'),
  cert: fs.readFileSync(process.env.SSL_CERT_PATH || './certs/localhost.pem'),
};

// Create HTTPS server
https.createServer(httpsOptions, app).listen(PORT, () => {
  console.log(`🔒 HTTPS Server running on https://localhost:${PORT}`);
  console.log(`🔐 Authorization URL: https://localhost:${PORT}/auth/instagram`);
});
