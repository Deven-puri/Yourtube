# Dynamic Theming & Region-Based Authentication

## Overview
This YouTube clone now features **context-aware theming** and **region-based secure authentication** based on user location and time.

---

## 🎨 Dynamic Theming

### Theme Rules
The website automatically switches themes based on:
- **User Location**: Must be in South India (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, or Telangana)
- **Time**: Between 10:00 AM and 12:00 PM IST

| Condition | Theme Applied |
|-----------|---------------|
| South India + 10 AM-12 PM IST | **Light Theme** (White) |
| All other cases | **Dark Theme** |

### How It Works
1. **Location Detection**: Uses IP-based geolocation (ipapi.co) to detect user's state
2. **Time Checking**: Converts current time to IST and checks if it's between 10-12 PM
3. **Auto-Update**: Theme refreshes every minute to respond to time changes
4. **Persistent**: Location is cached in localStorage to reduce API calls

### Files
- `/yourtube/src/lib/locationService.ts` - Location and time utilities
- `/yourtube/src/lib/ThemeContext.tsx` - Theme provider and management
- `/yourtube/src/pages/_app.tsx` - Theme integration

---

## 🔐 Region-Based Authentication

### Authentication Rules
Authentication method varies by user location:

| Region | Authentication Method |
|--------|----------------------|
| **South India** (TN, KL, KA, AP, TS) | Email OTP |
| **Other States** | Mobile OTP |

### OTP Flow
1. **Location Detection**: System detects user's state on signin page
2. **OTP Request**: 
   - South India users → Enter email → Receive OTP via email
   - Other states → Enter phone number → Receive OTP via SMS
3. **Verification**: Enter 6-digit OTP to login
4. **Auto-Login**: On successful verification, user is logged in

### Email OTP Configuration

#### Prerequisites
You need a Gmail account with "App Password" enabled.

#### Steps to Setup Email OTP:
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not enabled)
3. Scroll down to **App passwords**
4. Generate an app password for "Mail"
5. Copy the 16-character password

#### Environment Configuration
Create `/server/.env` file:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
NODE_ENV=development
```

**Note**: Never commit `.env` file to git. It's already in `.gitignore`.

### Mobile OTP Configuration (Optional)

For SMS OTP, you can integrate Twilio:

1. Sign up at https://www.twilio.com/
2. Get your Account SID, Auth Token, and Phone Number
3. Add to `/server/.env`:
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

4. Uncomment Twilio code in `/server/services/otpService.js`:
```javascript
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

await client.messages.create({
  body: `Your YourTube login OTP is: ${otp}. Valid for 5 minutes.`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: phoneNumber
});
```

5. Install Twilio: `npm install twilio`

**Development Mode**: In development, mobile OTP is logged to console for testing.

### Files
- `/server/services/otpService.js` - OTP generation and sending
- `/server/controllers/auth.js` - Authentication logic
- `/server/routes/auth.js` - Auth endpoints
- `/yourtube/src/pages/signin.tsx` - OTP-based signin UI

---

## 📡 API Endpoints

### POST `/user/request-otp`
Request OTP based on location.

**Request Body**:
```json
{
  "email": "user@example.com",  // Required for South India
  "phone": "+919876543210",      // Required for other states
  "state": "Tamil Nadu",
  "name": "User Name"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent to your email address",
  "authType": "email",
  "devOtp": "123456"  // Only in development
}
```

### POST `/user/verify-otp`
Verify OTP and login.

**Request Body**:
```json
{
  "identifier": "user@example.com",  // Email or phone
  "otp": "123456",
  "email": "user@example.com",
  "name": "User Name",
  "image": "https://...",
  "phone": "+919876543210"  // Optional
}
```

**Response**:
```json
{
  "result": {
    "_id": "...",
    "email": "user@example.com",
    "name": "User Name",
    "phone": "+919876543210"
  },
  "message": "Logged in successfully"
}
```

---

## 🛠️ Testing

### Test Light Theme
1. Use a VPN to set location to Chennai, India (or any South Indian city)
2. Set system time to 10:30 AM IST
3. Refresh the page
4. Theme should be light/white

### Test Dark Theme
1. Either:
   - Use VPN outside South India, OR
   - Set system time outside 10 AM - 12 PM IST
2. Refresh the page
3. Theme should be dark

### Test Email OTP (South India)
1. Use VPN to South India location
2. Go to `/signin`
3. See "Email OTP Authentication" badge
4. Enter email address
5. Click "Send OTP"
6. Check email for OTP
7. Enter OTP and verify

### Test Mobile OTP (Other States)
1. Use VPN to non-South India location (e.g., Delhi)
2. Go to `/signin`
3. See "Mobile OTP Authentication" badge
4. Enter phone number
5. Click "Send OTP"
6. Check console logs for OTP (in development)
7. Enter OTP and verify

---

## 🎯 Key Features

### Security
- ✅ OTPs expire after 5 minutes
- ✅ One-time use only
- ✅ Region-specific authentication
- ✅ Automatic cleanup of expired OTPs

### User Experience
- ✅ Automatic location detection
- ✅ Visual indicators for auth type
- ✅ Smooth theme transitions
- ✅ Persistent location caching
- ✅ Auto theme refresh every minute

### Development
- ✅ Development mode shows OTP in console
- ✅ In-memory OTP storage (Redis ready)
- ✅ Environment-based configuration
- ✅ Fallback mechanisms

---

## 🔄 Migration Notes

### Database
The User schema now includes:
```javascript
phone: { type: String, default: null }
```

Existing users will have `phone: null`. Phone number is added when they login with mobile OTP.

### Backward Compatibility
- ✅ Existing Google OAuth still works
- ✅ Existing users can login
- ✅ Theme defaults to dark on error
- ✅ Location defaults to email auth on error

---

## 📝 Notes

1. **Location Detection**: Uses IP-based geolocation which may not be 100% accurate. For production, consider:
   - HTML5 Geolocation API (requires user permission)
   - More accurate IP services
   - Manual state selection option

2. **OTP Storage**: Currently uses in-memory Map. For production:
   - Use Redis for distributed systems
   - Use database with TTL indexes
   - Consider rate limiting

3. **Email Sending**: Uses Gmail SMTP. For production:
   - Use dedicated email service (SendGrid, AWS SES)
   - Implement rate limiting
   - Add email templates

4. **SMS Sending**: Currently logs to console. For production:
   - Integrate Twilio, AWS SNS, or similar
   - Verify phone numbers
   - Handle international numbers

---

## 🚀 Quick Start

1. **Setup Email**:
```bash
cd server
cp .env.example .env
# Edit .env and add your Gmail credentials
```

2. **Start Backend**:
```bash
cd server
npm install
npm start
```

3. **Start Frontend**:
```bash
cd yourtube
npm install
npm run dev
```

4. **Test**:
- Navigate to http://localhost:3000/signin
- System will auto-detect your location
- Follow OTP flow based on your region

---

## 🤝 Support

For issues or questions:
1. Check console for errors
2. Verify email credentials in `.env`
3. Check location detection in browser DevTools
4. Review server logs for OTP sending

Happy coding! 🎉
