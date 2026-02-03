# Firebase OTP Authentication Setup

This project now uses **Firebase Authentication** for OTP services instead of custom implementations.

## Features

### 1. **Phone Authentication (SMS OTP)**
- For users outside South India
- Uses Firebase Phone Authentication
- Sends OTP via SMS automatically
- No need for Twilio integration

### 2. **Email Link Authentication**
- For users in South India (Tamil Nadu, Kerala, Karnataka, Andhra Pradesh, Telangana)
- Uses Firebase Email Link Authentication
- Sends magic link to email (no password needed)
- No need for Gmail app passwords

## Firebase Console Setup

### Step 1: Enable Phone Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `yourtube-e24ae`
3. Navigate to **Authentication** → **Sign-in method**
4. Click on **Phone** provider
5. Click **Enable**
6. Add your authorized domains (localhost:3000 is pre-authorized)
7. Click **Save**

### Step 2: Enable Email Link Authentication

1. In the same **Sign-in method** page
2. Click on **Email/Password** provider
3. Enable **Email link (passwordless sign-in)**
4. Click **Save**

### Step 3: Add Test Phone Numbers (Optional for Development)

1. In Authentication settings, scroll to **Phone numbers for testing**
2. Add test numbers with OTP codes (e.g., +919876543210 → 123456)
3. This allows testing without SMS quota limits

## How It Works

### Mobile OTP Flow (Non-South India Users)

1. User enters phone number
2. Firebase sends SMS with 6-digit OTP
3. User enters OTP
4. Firebase verifies OTP
5. Backend creates/updates user account
6. User is logged in

### Email Link Flow (South India Users)

1. User enters email address
2. Firebase sends email with magic link
3. User clicks link in email
4. Automatically redirects to app and logs in
5. Backend creates/updates user account

## Code Changes

### Frontend (`signin.tsx`)

- **Added Firebase imports**: `RecaptchaVerifier`, `signInWithPhoneNumber`, `sendSignInLinkToEmail`
- **Phone OTP**: Uses `signInWithPhoneNumber()` with invisible reCAPTCHA
- **Email Link**: Uses `sendSignInLinkToEmail()` for passwordless auth
- **Removed**: Custom OTP API calls to backend

### Backend (`auth.js`)

- **New endpoint**: `/user/firebase-auth` - Handles user creation/login from Firebase
- **Accepts**: Firebase UID, email/phone, name, image
- **Creates/updates**: User in MongoDB with Firebase UID
- **Legacy endpoints**: `/request-otp` and `/verify-otp` kept for backward compatibility

### Database Schema

- **Added field**: `firebaseUid` to user model for Firebase integration

## Benefits Over Custom OTP

✅ **No Email Configuration**: No need for Gmail app passwords or SMTP setup
✅ **No SMS Provider**: Firebase handles SMS delivery (no Twilio needed)
✅ **Better Security**: Firebase handles OTP generation, storage, and verification
✅ **Rate Limiting**: Built-in protection against abuse
✅ **Global SMS Coverage**: Firebase supports 200+ countries
✅ **Cost Effective**: Free tier includes 10K verifications/month
✅ **Simpler Code**: Less backend logic, fewer dependencies

## Testing

### Test Phone OTP

1. Navigate to `http://localhost:3000/signin`
2. Should auto-detect as "Mobile OTP Authentication" (if outside South India)
3. Enter phone number with country code: `+919876543210`
4. Click "Send OTP"
5. Check your phone for SMS
6. Enter 6-digit OTP
7. Click "Verify & Login"

### Test Email Link

1. Navigate to `http://localhost:3000/signin`
2. Should auto-detect as "Email OTP Authentication" (if in South India)
3. Enter email address
4. Click "Send OTP"
5. Check your email inbox
6. Click the sign-in link
7. Automatically logged in

## Environment Variables

No additional environment variables needed! Just ensure your Firebase config is set:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Troubleshooting

### reCAPTCHA Not Working

- Ensure you've enabled Phone Authentication in Firebase Console
- Check browser console for errors
- Try refreshing the page

### Phone Number Format

- Always include country code: `+91` for India
- Format: `+919876543210` (no spaces or dashes)

### Email Link Not Working

- Check spam folder
- Ensure Email Link auth is enabled in Firebase Console
- Email must be valid and accessible

### SMS Not Received

- Check Firebase Console quotas (free tier: 10K/month)
- Verify phone number is valid
- Try using test phone numbers in Firebase Console

## Migration Notes

- Old custom OTP endpoints still work for backward compatibility
- New users will automatically use Firebase authentication
- Existing users can continue using their accounts
- Firebase UID is added to existing users on first Firebase login
