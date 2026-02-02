# Plan Tiers & Watch Time Feature

## Overview

This feature implements a tiered subscription system with watch time limits and email invoice notifications.

## Plan Tiers

### Free Plan (Default)
- **Cost**: Free
- **Watch Time**: 5 minutes per day
- **Downloads**: 1 video per day
- **Quality**: Standard definition
- **Ads**: Yes

### Bronze Plan
- **Cost**: ₹10/month
- **Watch Time**: 7 minutes per day
- **Downloads**: 1 video per day
- **Quality**: HD
- **Ads**: Yes

### Silver Plan
- **Cost**: ₹50/month
- **Watch Time**: 10 minutes per day
- **Downloads**: 5 videos per day
- **Quality**: Full HD
- **Ads**: No
- **Additional**: Priority support

### Gold Plan
- **Cost**: ₹100/month
- **Watch Time**: Unlimited
- **Downloads**: Unlimited
- **Quality**: 4K
- **Ads**: No
- **Additional**: Priority support + Exclusive content

## Technical Implementation

### Backend

#### Database Schema Updates
```javascript
// User Model (server/Modals/Auth.js)
{
  planType: { type: String, enum: ['Free', 'Bronze', 'Silver', 'Gold'], default: 'Free' },
  watchTimeLimit: { type: Number, default: 300 }, // seconds
  totalWatchedTime: { type: Number, default: 0 },
  lastWatchReset: { type: Date, default: Date.now }
}
```

#### API Endpoints

**Premium Routes** (`/premium/*`):
- `POST /premium/create-order` - Create Razorpay order for plan upgrade
- `POST /premium/verify-payment` - Verify payment and activate plan
- `GET /premium/status/:userId` - Get user's current plan status
- `GET /premium/watch-time/:userId` - Get watch time status
- `POST /premium/watch-time/:userId` - Update watched time

#### Email Service

**Invoice Email** (sent after successful payment):
- Contains transaction details
- Plan benefits
- Invoice HTML template
- Automatic delivery

**Configuration** (`.env`):
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-specific-password
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
```

### Frontend

#### Watch Time Tracking

The video player automatically:
1. Checks user's watch time limit on mount
2. Updates watch time every 10 seconds while playing
3. Pauses video when limit reached
4. Shows upgrade modal when limit exceeded

#### Premium Page

Located at `/premium/index.tsx`:
- Displays all 4 plan tiers
- Razorpay payment integration
- Visual plan comparison
- Upgrade options for existing premium users

#### Video Player

`Videopplayer.tsx` features:
- Real-time remaining time display
- Automatic pause at limit
- Upgrade prompts
- Daily reset of watch time

## Payment Flow

1. User selects a plan (Bronze/Silver/Gold)
2. Creates Razorpay order via API
3. Razorpay checkout modal opens
4. User completes payment
5. Backend verifies payment signature
6. Updates user's plan in database
7. Sends invoice email
8. Redirects to downloads/homepage

## Watch Time Logic

1. **Daily Reset**: Watch time resets at midnight
2. **Tracking**: Video player updates watch time every 10 seconds
3. **Enforcement**: Video pauses when limit reached
4. **Unlimited**: Gold plan bypasses all tracking

## Email Templates

### Invoice Email Includes:
- Customer name and email
- Plan type with colored badge
- Transaction ID
- Payment amount
- Plan benefits list
- Activation date
- Call-to-action button

### Setup Gmail for Emails:
1. Enable 2-Factor Authentication in Gmail
2. Generate App-Specific Password
3. Add to `.env` file:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=app-specific-password
   ```

## Testing

### Test Payment (Razorpay Test Mode):
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
Name: Any name
```

### Test Watch Time:
1. Sign in as Free user
2. Start watching a video
3. After 5 minutes, should see limit modal
4. Upgrade to Bronze/Silver/Gold
5. Enjoy extended/unlimited watch time

## Database Migrations

No migrations needed. New fields have default values:
- `planType`: 'Free'
- `watchTimeLimit`: 300 (5 minutes)
- `totalWatchedTime`: 0
- `lastWatchReset`: Current date

## User Experience Flow

### Free User Journey:
1. Watch video → Counter shows "4:30 left today"
2. Reaches 5:00 → Video pauses
3. Modal appears → "Upgrade to watch more"
4. Click "Upgrade Now" → Premium page
5. Select plan → Pay → Email invoice
6. Return to watching with new limits

### Upgrade Path:
```
Free (5 min) → Bronze (7 min) → Silver (10 min) → Gold (Unlimited)
   ₹0           ₹10              ₹50              ₹100
```

## Features

✅ Tiered subscription plans
✅ Watch time tracking and enforcement
✅ Daily watch time reset
✅ Video player integration
✅ Razorpay payment gateway
✅ Email invoice delivery
✅ Plan upgrade options
✅ Visual plan comparison
✅ Real-time limit indicators
✅ Graceful limit handling

## Future Enhancements

- Annual billing options
- Plan downgrade support
- Watch history analytics
- Family/team plans
- Promotional discounts
- Gift subscriptions

## Support

For issues or questions:
1. Check email invoice for transaction details
2. Verify payment in Razorpay dashboard
3. Check plan status at `/premium` page
4. Contact support with transaction ID
