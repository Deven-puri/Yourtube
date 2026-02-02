# Video Download & Premium Subscription Feature

This document outlines the implementation of the video download feature with premium subscription system using Razorpay payments.

## Features Implemented

### 1. Video Download System
- **Free Users**: Can download 1 video per day
- **Premium Users**: Unlimited video downloads
- **Download Tracking**: All downloads are recorded in the database
- **Download History**: Users can view and manage their downloaded videos

### 2. Premium Subscription
- **Payment Gateway**: Razorpay integration (test mode)
- **Subscription Plans**:
  - Monthly: ₹99/month
  - Yearly: ₹999/year (save ₹189)
- **Premium Benefits**:
  - Unlimited video downloads
  - HD quality downloads
  - No advertisements
  - Priority support
  - Download history tracking

### 3. User Interface
- Downloads page (`/downloads`) - View all downloaded videos
- Premium upgrade page (`/premium`) - Subscribe to premium plans
- Download button on video player with limit enforcement
- Premium upgrade prompts for free users who exceed limits
- Sidebar navigation with Downloads and Premium links

## Database Schema

### User Model Updates
```javascript
{
  email: String (required),
  name: String,
  channelname: String,
  description: String,
  image: String,
  joinedon: Date,
  isPremium: Boolean (default: false),
  premiumExpiry: Date (default: null),
  dailyDownloads: Number (default: 0),
  lastDownloadDate: Date (default: null)
}
```

### Download Model
```javascript
{
  userId: ObjectId (ref: "User"),
  videoId: ObjectId (ref: "Video"),
  downloadedAt: Date (default: Date.now)
}
```

## API Endpoints

### Download Routes (`/download`)
- `GET /check-limit/:userId` - Check if user can download
- `POST /download/:userId/:videoId` - Download a video
- `GET /history/:userId` - Get user's download history
- `DELETE /delete/:downloadId` - Remove download record

### Premium Routes (`/premium`)
- `POST /create-order` - Create Razorpay payment order
- `POST /verify-payment` - Verify payment and activate premium
- `GET /status/:userId` - Check premium subscription status

## Razorpay Integration

### Test Mode Configuration
The application is configured for Razorpay test mode for development:

**Backend (.env)**:
```env
RAZORPAY_KEY_ID=rzp_test_sample_key
RAZORPAY_KEY_SECRET=sample_secret
```

### Payment Flow
1. User selects subscription plan (monthly/yearly)
2. Backend creates Razorpay order via API
3. Razorpay checkout modal opens on frontend
4. User completes payment
5. Backend verifies payment signature
6. Premium status is activated for user
7. Subscription expiry date is set based on plan

### Test Payment Cards
For testing in development mode, use Razorpay test cards:
- **Success**: 4111 1111 1111 1111
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **Name**: Any name

## Download Limit Logic

### Free Users
1. Daily download count resets at midnight (server time)
2. Maximum 1 download per day
3. When limit is reached, user is prompted to upgrade
4. Download count is tracked per user

### Premium Users
1. No download limits
2. Premium status checked before each download
3. Premium expiry date validated
4. Expired premium users revert to free tier limits

## Frontend Components

### Pages
- `/downloads/index.tsx` - Downloads history page
- `/premium/index.tsx` - Premium subscription page

### Updated Components
- `VideoInfo.tsx` - Added download button with limit checks
- `Sidebar.tsx` - Added Downloads and Premium navigation links

### Features
- Download button on every video
- Premium upgrade modal when limit exceeded
- Download history with re-download capability
- Premium status display
- Responsive design for all screen sizes

## Setup Instructions

### 1. Backend Setup

Install dependencies:
```bash
cd server
npm install razorpay
```

Add environment variables to `server/.env`:
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 2. Get Razorpay Credentials

1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to Settings → API Keys
3. Generate test mode API keys
4. Copy Key ID and Key Secret to `.env` file

### 3. Frontend Setup

No additional packages required. The Razorpay checkout script is loaded dynamically.

### 4. Testing

1. Start backend server: `cd server && node index.js`
2. Start frontend: `cd yourtube && npm run dev`
3. Sign in to the application
4. Try downloading a video (1 free download per day)
5. Attempt second download to see premium prompt
6. Navigate to `/premium` to subscribe
7. Use test card to complete payment
8. Verify unlimited downloads work after subscription

## Production Deployment

### Switch to Live Mode

1. **Razorpay Dashboard**:
   - Switch to Live mode
   - Generate live API keys
   - Configure webhooks (optional for subscription renewals)

2. **Update Environment Variables**:
```env
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_live_secret
```

3. **Bank Account Setup**:
   - Add bank account details in Razorpay dashboard
   - Complete KYC verification
   - Activate payment methods

### Security Considerations

1. **Never expose** Razorpay Key Secret in frontend code
2. All payment verification happens on backend
3. Payment signatures are cryptographically verified
4. User premium status is server-side validated
5. Download limits are enforced server-side

## Future Enhancements

1. **Webhook Integration**: Auto-renewal handling
2. **Email Notifications**: Payment confirmations, renewal reminders
3. **Download Analytics**: Track popular downloads
4. **Multiple Quality Options**: Different video quality downloads
5. **Offline Viewing**: PWA with service workers
6. **Family Plans**: Multiple user subscriptions
7. **Grace Period**: 7-day grace period after expiry
8. **Promo Codes**: Discount code system

## Troubleshooting

### Payment Not Working
- Check Razorpay credentials in `.env`
- Ensure test mode is enabled in Razorpay dashboard
- Verify Razorpay script is loading (check browser console)
- Check CORS settings allow Razorpay domain

### Download Limits Not Enforcing
- Verify User model has premium fields
- Check MongoDB connection is working
- Ensure server time is correct (affects daily reset)
- Verify userId is being passed correctly

### Premium Not Activating After Payment
- Check payment verification signature
- Verify userId is correct
- Check MongoDB can update user document
- Review server logs for errors

## Support

For issues related to:
- **Razorpay Integration**: [Razorpay Docs](https://razorpay.com/docs/)
- **Payment Testing**: [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- **Webhooks**: [Razorpay Webhooks](https://razorpay.com/docs/webhooks/)

## License

This feature implementation follows the same license as the main project.
