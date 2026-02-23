# YouTube Clone with VoIP Video Calling & Premium Downloads

A full-stack project built with Next.js, Express, MongoDB, and featuring real-time WebRTC video calling capabilities and premium subscription system.

## Features

- 🎥 Video upload and playback
- 👤 User authentication (Google OAuth via Firebase)
- 💬 Comments system
- 👍 Like/Dislike videos
- 📺 Watch later functionality
- 🔍 Search videos
- 👥 Channel pages
- 📜 Watch history
- 📞 **Real-time Video Calling with WebRTC**
- 🖥️ **Screen Sharing**
- 🎙️ **Audio/Video Controls**
- 📹 **Call Recording**
- 📥 **Video Downloads** (1 per day for free users)
- 👑 **Premium Subscription** (Unlimited downloads)
- 💳 **Razorpay Payment Integration**

## Tech Stack

### Frontend
- Next.js 15.3.3
- React 19
- TypeScript
- Tailwind CSS v4
- Socket.io Client
- Simple-peer (WebRTC)
- Firebase Authentication
- Axios
- Razorpay Checkout

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- Socket.io (for WebRTC signaling)
- Multer (file uploads)
- Mongoose
- Razorpay Payment Gateway

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account
- Firebase project (for authentication)
- Razorpay account (for payments)
- npm or yarn

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Deven-puri/Yourtube.git
cd Yourtube
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
PORT=5001
DB_URL=your_mongodb_atlas_connection_string
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Frontend Setup

```bash
cd yourtube
npm install
```

Create a `.env.local` file in the `yourtube` directory:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Running the Application

### Start Backend Server

```bash
cd server
node index.js
```

Backend will run on `http://localhost:5001`

### Start Frontend

```bash
cd yourtube
npm run dev
```

Frontend will run on `http://localhost:3000`

## Video Download & Premium Features

### Free Users
- Download 1 video per day
- Access to basic features
- View download history

### Premium Subscription
- **Monthly Plan**: ₹99/month
- **Yearly Plan**: ₹999/year (save ₹189)
- **Benefits**:
  - Unlimited video downloads
  - HD quality downloads
  - Priority support
  - Ad-free experience

### Using Downloads
1. Click the "Download" button on any video
2. Free users: 1 download per day
3. Premium users: Unlimited downloads
4. View all downloads at `/downloads`
5. Re-download or remove videos from history

### Upgrading to Premium
1. Navigate to `/premium` or click "Premium" in sidebar
2. Choose monthly or yearly plan
3. Click "Subscribe"
4. Complete payment via Razorpay (test mode)
5. Use test card: 4111 1111 1111 1111
6. Enjoy unlimited downloads!

## VoIP Video Calling Usage

1. Click the video call icon in the header
2. Choose to create a new call or join an existing one
3. Share the room link with others to join your call
4. Use the control buttons to:
   - Mute/unmute microphone
   - Turn camera on/off
   - Share your screen
   - Record the call
   - End the call

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Add your IP address to the whitelist
4. Create a database user
5. Get your connection string and add it to the backend `.env` file

## Firebase Setup

1. Create a Firebase project
2. Enable Google Authentication
3. Get your Firebase configuration
4. Add the configuration to the frontend `.env.local` file

## Razorpay Setup

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to Settings → API Keys
3. Generate **Test Mode** API keys for development
4. Copy Key ID and Key Secret to backend `.env` file
5. For production: Switch to Live mode and generate live keys

### Test Payment Cards
- **Card Number**: 4111 1111 1111 1111
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **Name**: Any name

## Project Structure

```
├── server/                 # Backend Express server
│   ├── controllers/        # Route controllers
│   │   ├── download.js     # Download logic
│   │   ├── premium.js      # Premium subscription
│   │   └── ...
│   ├── Modals/            # MongoDB models
│   │   ├── download.js     # Download model
│   │   ├── Auth.js         # User model (with premium fields)
│   │   └── ...
│   ├── routes/            # API routes
│   │   ├── download.js     # Download routes
│   │   ├── premium.js      # Premium routes
│   │   └── ...
│   ├── filehelper/        # File upload helpers
│   └── index.js           # Server entry point
├── yourtube/              # Frontend Next.js app
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── VideoInfo.tsx    # Video player with download
│   │   │   └── Sidebar.tsx      # Navigation with Downloads/Premium
│   │   ├── pages/         # Next.js pages
│   │   │   ├── downloads/       # Downloads page
│   │   │   ├── premium/         # Premium subscription page
│   │   │   └── ...
│   │   ├── lib/           # Utilities and hooks
│   │   └── styles/        # Global styles
│   └── public/            # Static assets
├── README.md
├── DOWNLOAD_FEATURE.md    # Detailed download feature docs
└── VOIP_FEATURE.md        # VoIP feature documentation
```

## Environment Variables

### Backend (.env)
- `PORT`: Server port (default: 5001)
- `DB_URL`: MongoDB Atlas connection string
- `RAZORPAY_KEY_ID`: Razorpay API Key ID
- `RAZORPAY_KEY_SECRET`: Razorpay API Secret

### Frontend (.env.local)
- `NEXT_PUBLIC_BACKEND_URL`: Backend API URL
- Firebase configuration variables

## Deployment

### Backend
- Can be deployed to Heroku, Railway, Render, or any Node.js hosting
- Ensure MongoDB Atlas IP whitelist includes your hosting provider's IPs
- Set environment variables on the hosting platform

### Frontend
- Can be deployed to Vercel, Netlify, or any Next.js hosting
- Update `NEXT_PUBLIC_BACKEND_URL` to point to your deployed backend
- Set all environment variables on the hosting platform
- **Important**: Switch Razorpay to Live mode for production payments

## Known Issues

- macOS port 5000 is blocked by AirPlay Receiver - use port 5001 instead
- Large video uploads may require timeout adjustments
- Ensure camera/microphone permissions are granted for video calls
- Download feature requires adequate server storage for video files
- Razorpay test mode for development - switch to live for production

## Documentation

- [VoIP Feature Documentation](VOIP_FEATURE.md) - Detailed guide for video calling
- [Download Feature Documentation](DOWNLOAD_FEATURE.md) - Complete guide for downloads & premium

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.

## Acknowledgments

- Next.js team for the amazing framework
- Firebase for authentication
- MongoDB for database
- Socket.io and Simple-peer for WebRTC implementation
