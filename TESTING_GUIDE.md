# Quick Start Guide - Testing Download & Premium Features

## Prerequisites
- Both frontend and backend servers running
- User account created and signed in
- At least one video uploaded to the platform

## Testing Download Feature (Free User)

### Test Case 1: First Download of the Day
1. Navigate to any video page
2. Click the "Download" button below the video
3. **Expected**: Download should start, video added to Downloads page
4. Navigate to `/downloads` to verify

### Test Case 2: Second Download (Limit Exceeded)
1. Try to download another video on the same day
2. **Expected**: Premium upgrade modal should appear
3. Modal should display:
   - Crown icon
   - "Upgrade to Premium" message
   - Explanation of daily limit
   - "Upgrade Now" button
   - "Maybe Later" button

### Test Case 3: Check Download Limit
1. Open browser console
2. Look for download limit check response
3. **Expected**: 
   ```json
   {
     "canDownload": false,
     "isPremium": false,
     "downloadsToday": 1,
     "limit": 1,
     "message": "Daily download limit reached..."
   }
   ```

## Testing Premium Subscription

### Test Case 4: Access Premium Page
1. Navigate to `/premium` or click "Premium" in sidebar
2. **Expected**: Premium subscription page should load with:
   - Crown icon and gradient title
   - Benefits section (3 cards)
   - Two pricing plans (Monthly ₹99, Yearly ₹999)
   - Plan selection interface

### Test Case 5: Monthly Subscription
1. Select Monthly plan (should have purple ring around it)
2. Click "Subscribe to Monthly Plan" button
3. **Expected**: Razorpay checkout modal opens
4. Fill in test payment details:
   - **Card**: 4111 1111 1111 1111
   - **CVV**: 123
   - **Expiry**: 12/25
   - **Name**: Test User
5. Click "Pay ₹99"
6. **Expected**: 
   - Payment success message
   - Redirect to `/downloads` page
   - User is now premium

### Test Case 6: Verify Premium Status
1. Navigate to `/premium` again
2. **Expected**: Should show premium status page:
   - "You're a Premium Member!" message
   - Premium expiry date
   - Days remaining
   - "Go to Downloads" button

### Test Case 7: Unlimited Downloads (Premium)
1. As a premium user, try downloading multiple videos
2. **Expected**: 
   - No limit restrictions
   - All downloads succeed
   - No upgrade prompts
   - All videos appear in `/downloads`

## Testing Downloads Page

### Test Case 8: View Download History
1. Navigate to `/downloads`
2. **Expected**: Page should display:
   - Header with premium status
   - Grid of downloaded videos with:
     - Video thumbnail
     - Video title
     - Channel name
     - Downloaded date
     - "Download Again" button
     - "Remove" button

### Test Case 9: Re-download Video
1. Click "Download Again" on any video
2. **Expected**: File download should start immediately
3. Video file should download to your downloads folder

### Test Case 10: Remove Download Record
1. Click "Remove" button on any download
2. **Expected**: Download should be removed from the list
3. Total count should decrease

## Testing Edge Cases

### Test Case 11: Expired Premium
1. **Manual Test**: In MongoDB, set `premiumExpiry` to past date
2. Try to download a video
3. **Expected**: Should be treated as free user with daily limit

### Test Case 12: Not Signed In
1. Sign out from the application
2. Try to click Download button
3. **Expected**: Alert "Please sign in to download videos"

### Test Case 13: New Day Reset
1. Download 1 video today (as free user)
2. **Manual Test**: Change system date to tomorrow
3. Try downloading another video
4. **Expected**: Download should succeed (daily limit reset)

## Backend API Testing

### Test API 1: Check Download Limit
```bash
curl http://localhost:5001/download/check-limit/{userId}
```
**Expected Response**:
```json
{
  "canDownload": true/false,
  "isPremium": true/false,
  "downloadsToday": 0,
  "limit": 1,
  "message": "..."
}
```

### Test API 2: Download Video
```bash
curl -X POST http://localhost:5001/download/download/{userId}/{videoId}
```
**Expected Response**:
```json
{
  "message": "Download recorded successfully",
  "videoUrl": "/uploads/video.mp4",
  "videoTitle": "Sample Video",
  "downloadId": "..."
}
```

### Test API 3: Get Download History
```bash
curl http://localhost:5001/download/history/{userId}
```
**Expected Response**:
```json
{
  "downloads": [
    {
      "_id": "...",
      "userId": "...",
      "videoId": {...},
      "downloadedAt": "2026-02-02T..."
    }
  ]
}
```

### Test API 4: Premium Status
```bash
curl http://localhost:5001/premium/status/{userId}
```
**Expected Response**:
```json
{
  "isPremium": true/false,
  "premiumExpiry": "2026-03-02T...",
  "daysRemaining": 30
}
```

## Database Verification

### Verify User Model
1. Open MongoDB Compass or Atlas
2. Check `users` collection
3. Verify a user document has:
   ```json
   {
     "isPremium": false,
     "premiumExpiry": null,
     "dailyDownloads": 0,
     "lastDownloadDate": null
   }
   ```

### Verify Download Records
1. Check `downloads` collection
2. Verify download document has:
   ```json
   {
     "userId": "ObjectId(...)",
     "videoId": "ObjectId(...)",
     "downloadedAt": "ISODate(...)"
   }
   ```

### After Premium Subscription
1. Check user document again
2. Verify fields updated:
   ```json
   {
     "isPremium": true,
     "premiumExpiry": "ISODate(future date)"
   }
   ```

## Common Issues & Solutions

### Issue 1: Download Button Not Working
- **Check**: Browser console for errors
- **Solution**: Verify backend is running on port 5001
- **Verify**: NEXT_PUBLIC_BACKEND_URL is set correctly

### Issue 2: Razorpay Not Loading
- **Check**: Network tab for Razorpay script
- **Solution**: Ensure internet connection is stable
- **Verify**: Razorpay keys in `.env` file

### Issue 3: Payment Verification Failed
- **Check**: Server logs for signature mismatch
- **Solution**: Verify RAZORPAY_KEY_SECRET matches dashboard
- **Check**: Payment order ID matches

### Issue 4: Downloads Not Showing
- **Check**: MongoDB connection
- **Solution**: Verify download was recorded in database
- **Check**: User ID is correct

### Issue 5: Daily Limit Not Resetting
- **Check**: Server system time
- **Solution**: Ensure server time is accurate
- **Verify**: `lastDownloadDate` field in user document

## Performance Testing

### Load Test: Multiple Downloads
1. Try downloading 5 videos quickly (as premium)
2. **Expected**: All should succeed without errors
3. Check server memory usage

### Load Test: Concurrent Payments
1. Open 2 browser windows
2. Try subscribing simultaneously
3. **Expected**: Both should process correctly
4. No duplicate subscriptions

## Security Checks

### Check 1: Payment Signature Verification
- All payments should be verified server-side
- Invalid signatures should be rejected

### Check 2: Download Limits Enforced Server-Side
- Frontend restrictions can be bypassed
- Server should still enforce limits

### Check 3: Premium Status Validation
- Premium status checked on every download
- Expired premium treated as free user

## Success Criteria

✅ Free users can download 1 video per day
✅ Premium users can download unlimited videos
✅ Payment flow completes successfully with test card
✅ Premium status activates after payment
✅ Download history displays correctly
✅ Daily limits reset properly
✅ All API endpoints respond correctly
✅ Database records created/updated properly

## Next Steps

After successful testing:
1. Switch Razorpay to Live mode for production
2. Update test keys with live keys
3. Test with real payment methods
4. Set up webhooks for auto-renewals (optional)
5. Deploy to production environment

---

**Note**: This is a test environment. Always use test credentials and never real payment information during development.
