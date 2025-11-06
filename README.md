# Instagram Automation API

A Node.js application for automating Instagram content publishing using the Instagram Graph API. This app allows you to publish photos and videos to Instagram business accounts through a secure HTTPS REST API.

## Features

- 🔐 **OAuth 2.0 Authentication** - Secure Instagram account connection
- 📸 **Photo Publishing** - Post images to Instagram with captions
- 🎥 **Video/Reel Publishing** - Upload videos and reels
- 👤 **Account Management** - View connected Instagram accounts
- 🔒 **HTTPS Support** - Secure SSL/TLS enabled server
- 💾 **MongoDB Integration** - Persistent storage for user tokens

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database (local or MongoDB Atlas)
- Instagram Business Account
- Facebook Developer Account with an approved app
- SSL certificates for HTTPS (included in `certs/` folder)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd insta-app-test-1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
PORT=3000
MONGO_URI="your_mongodb_connection_string"

# Instagram App Credentials (from your Meta Developer dashboard)
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_REDIRECT_URI=https://localhost:3000/auth/instagram/callback

SSL_KEY_PATH=./certs/localhost-key.pem
SSL_CERT_PATH=./certs/localhost.pem

NODE_ENV=development
```

### 4. Set Up Instagram App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add the **Instagram Graph API** product
4. Configure OAuth redirect URIs: `https://localhost:3000/auth/instagram/callback`
5. Add required permissions:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
6. Copy your App ID and App Secret to the `.env` file

### 5. Generate SSL Certificates (if needed)

If you need to generate new SSL certificates for local development:

```bash
# Using OpenSSL
openssl req -x509 -newkey rsa:4096 -keyout certs/localhost-key.pem -out certs/localhost.pem -days 365 -nodes
```

## Running the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `https://localhost:3000`

## API Endpoints

### Authentication

#### Authorize Instagram Account
```
GET https://localhost:3000/auth/instagram
```
Redirects to Instagram OAuth authorization page.

#### OAuth Callback
```
GET https://localhost:3000/auth/instagram/callback
```
Handles the OAuth callback from Instagram (automatically called after authorization).

### Instagram Operations

#### Get Connected Accounts
```
GET https://localhost:3000/api/instagram/accounts
```

**Query Parameters:**
- `userId` (required) - MongoDB User ID

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "id": "instagram_account_id",
      "username": "your_username"
    }
  ]
}
```

#### Publish Photo
```
POST https://localhost:3000/api/instagram/publish/photo
```

**Request Body:**
```json
{
  "userId": "mongodb_user_id",
  "imageUrl": "https://example.com/image.jpg",
  "caption": "Your photo caption #hashtags"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "instagram_media_id"
  }
}
```

#### Publish Video/Reel
```
POST https://localhost:3000/api/instagram/publish/video
```

**Request Body:**
```json
{
  "userId": "mongodb_user_id",
  "videoUrl": "https://example.com/video.mp4",
  "caption": "Your video caption #hashtags",
  "isReel": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "instagram_media_id"
  }
}
```

## Project Structure

```
insta-app-test-1/
├── certs/                      # SSL certificates
│   ├── localhost-key.pem
│   └── localhost.pem
├── config/
│   └── db.js                   # MongoDB connection config
├── controllers/
│   ├── authController.js       # Authentication logic
│   └── instagramController.js  # Instagram API operations
├── models/
│   └── User.js                 # User model schema
├── routes/
│   ├── auth.js                 # Authentication routes
│   └── instagram.js            # Instagram API routes
├── .env                        # Environment variables (not in git)
├── .env.example                # Environment variables template
├── package.json                # Project dependencies
├── server.js                   # Main application entry point
└── README.md                   # This file
```

## Usage Example

### 1. Authorize Your Instagram Account

Visit `https://localhost:3000/auth/instagram` in your browser and complete the authorization flow.

### 2. Get Your User ID

After authorization, check your MongoDB database for the created user record and note the `_id`.

### 3. Publish a Photo

```bash
curl -X POST https://localhost:3000/api/instagram/publish/photo \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your_mongodb_user_id",
    "imageUrl": "https://example.com/photo.jpg",
    "caption": "Check out this photo! #instagram #api"
  }'
```

### 4. Publish a Video

```bash
curl -X POST https://localhost:3000/api/instagram/publish/video \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your_mongodb_user_id",
    "videoUrl": "https://example.com/video.mp4",
    "caption": "New video content! #reels",
    "isReel": true
  }'
```

## Important Notes

- **Media URLs**: Images and videos must be publicly accessible URLs (HTTPS required)
- **Image Requirements**: 
  - Formats: JPEG, PNG
  - Max file size: 8MB
  - Aspect ratio: 4:5 to 1.91:1
- **Video Requirements**:
  - Formats: MP4, MOV
  - Max file size: 100MB
  - Duration: 3-60 seconds (Reels), up to 60 minutes (videos)
  - Aspect ratio: 9:16 (Reels), various for videos
- **Rate Limits**: Instagram API has rate limits - check Meta's documentation for details
- **Token Expiration**: Access tokens expire after 60 days - implement token refresh logic for production

## Troubleshooting

### SSL Certificate Errors

If you get SSL certificate warnings in your browser, you can:
- Add an exception for `localhost` (safe for development)
- Import the certificate into your system's trusted certificates

### MongoDB Connection Issues

- Verify your `MONGO_URI` is correct
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure MongoDB service is running (if using local MongoDB)

### Instagram API Errors

- Verify your app is in "Live" mode on Meta Developer dashboard
- Check that all required permissions are granted
- Ensure your Instagram account is a Business account
- Verify the Facebook Page is connected to your Instagram account

## Security Considerations

- Never commit `.env` file to version control
- Keep your App Secret secure
- Use environment variables for all sensitive data
- Implement proper authentication for API endpoints in production
- Use rate limiting to prevent abuse
- Validate and sanitize all user inputs

## License

ISC

## Author

reedu

## Support

For issues and questions, please check the [Instagram Graph API documentation](https://developers.facebook.com/docs/instagram-api/).
