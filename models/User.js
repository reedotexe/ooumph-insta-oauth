const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  instagramUserId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  tokenExpiry: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastPostAt: {
    type: Date,
  },
});

module.exports = mongoose.model('User', userSchema);
