# VoIP Video Call Feature

## Overview
A complete WebRTC-based video calling system integrated into the YouTube clone application. Supports peer-to-peer video calls, screen sharing (including YouTube content), and local session recording.

## Features Implemented

### ✅ Core Functionality
1. **Video Calling** - Real-time peer-to-peer video and audio communication
2. **Screen Sharing** - Share your screen, including YouTube videos
3. **Call Recording** - Record calls and save locally as .webm files
4. **Audio/Video Controls** - Mute, camera on/off, with visual indicators
5. **Multi-Party Support** - Support for multiple participants in a call
6. **Responsive UI** - Works on desktop, tablet, and mobile devices

### 🏗️ Technical Architecture

#### Backend (Socket.io Signaling Server)
- **File**: `/server/index.js`
- **Technology**: Socket.io for WebRTC signaling
- **Features**:
  - Room management (join/leave)
  - WebRTC offer/answer exchange
  - ICE candidate relay
  - Screen sharing notifications
  - Auto-cleanup on disconnect

#### Frontend Components

1. **useWebRTC Hook** (`/yourtube/src/lib/useWebRTC.js`)
   - Manages WebRTC peer connections
   - Handles media streams (camera, microphone, screen)
   - Implements MediaRecorder for recording
   - Controls: mute, video on/off, screen share, recording

2. **VideoCall Component** (`/yourtube/src/components/VideoCall.tsx`)
   - Main call interface
   - Video grid layout (responsive 1-3 columns)
   - Control panel with all call functions
   - Real-time status indicators

3. **CallStarter Component** (`/yourtube/src/components/CallStarter.tsx`)
   - Dialog for creating/joining calls
   - Room ID generation
   - Link sharing with copy button
   - Integrated in Header

4. **Socket Client** (`/yourtube/src/lib/socket.js`)
   - Socket.io client configuration
   - Connects to backend signaling server

## Usage Guide

### Starting a Call

1. **From Header**: Click the video call icon in the header (visible when logged in)
2. **Create New Call**: Click "Create New Call" to generate a unique room
3. **Join Existing**: Enter a room ID to join an ongoing call
4. **Share Link**: Copy the room link and share with friends

### During a Call

#### Controls Available:
- 🎤 **Mute/Unmute** - Toggle microphone (red when muted)
- 📹 **Camera On/Off** - Toggle video (red when off, shows placeholder)
- 🖥️ **Screen Share** - Share your screen (blue when active)
- 🔴 **Record** - Start/stop recording (red pulse when recording)
- 📞 **End Call** - Leave the call and return home

#### Screen Sharing YouTube:
1. Click the screen share button
2. Select "Browser Tab" or "Entire Screen"
3. Choose the tab with YouTube playing
4. Click "Share"
4. All participants can now see your YouTube video!

#### Recording:
1. Click the record button (download icon)
2. Red "Recording" indicator appears
3. Click again to stop
4. Video automatically downloads as `.webm` file
5. Can be played in browsers or converted to MP4

### Call Flow

```
User A                     Signaling Server              User B
  |                              |                          |
  |--join-room------------------>|                          |
  |                              |<--join-room--------------|
  |                              |                          |
  |<--all-users (User B)---------|                          |
  |                              |                          |
  |--sending-signal------------->|                          |
  |                              |--user-joined------------>|
  |                              |                          |
  |                              |<--returning-signal-------|
  |<--receiving-returned-signal--|                          |
  |                              |                          |
  |<========WebRTC P2P Connection Established=========>|
  |                              |                          |
  |--start-screen-share--------->|--user-started-share----->|
```

## Configuration

### STUN Servers
Uses Google's public STUN servers for NAT traversal:
- `stun:stun.l.google.com:19302`
- `stun:stun1.l.google.com:19302`

For production, consider adding TURN servers for better connectivity.

### Supported Codecs
- **Video Recording**: VP9 (fallback to VP8)
- **Format**: WebM
- **Resolution**: Up to 1280x720

## File Structure

```
server/
└── index.js (Socket.io signaling server)

yourtube/src/
├── lib/
│   ├── socket.js (Socket.io client)
│   └── useWebRTC.js (WebRTC hook)
├── components/
│   ├── VideoCall.tsx (Main call UI)
│   ├── CallStarter.tsx (Call dialog)
│   └── Header.tsx (Updated with call button)
└── pages/
    └── call/
        └── [roomId].tsx (Call page route)
```

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Video Call | ✅ | ✅ | ✅ | ✅ |
| Screen Share | ✅ | ✅ | ⚠️ 13+ | ✅ |
| Recording | ✅ | ✅ | ⚠️ Limited | ✅ |

⚠️ Safari has limited MediaRecorder support (may require polyfill)

## Security Considerations

### Current Implementation (Development)
- Unencrypted signaling
- No authentication on room join
- Public STUN servers

### Production Recommendations
1. **Add Room Authentication**
   - Verify user permissions before joining
   - Generate signed room tokens
   
2. **HTTPS Required**
   - WebRTC requires HTTPS in production
   - Get SSL certificate (Let's Encrypt)

3. **TURN Server**
   - Add TURN server for firewall traversal
   - Consider: Twilio, Xirsys, or self-hosted coturn

4. **Rate Limiting**
   - Limit room creation per user
   - Socket connection throttling

## Troubleshooting

### Camera/Mic Not Working
- Check browser permissions
- Ensure HTTPS (required for getUserMedia)
- Try different browser

### Can't Connect to Other User
- Check firewall settings
- Both users must grant media permissions
- Consider adding TURN server

### Recording Not Downloading
- Check browser download settings
- Ensure sufficient disk space
- Try different browser (Safari limitations)

### Screen Share Not Showing
- Ensure correct tab/screen selected
- Check screen sharing permissions
- Refresh if stream freezes

## Future Enhancements

### Planned Features
- [ ] End-to-end encryption
- [ ] Chat during calls
- [ ] Virtual backgrounds
- [ ] Call quality indicators
- [ ] Participant limit controls
- [ ] Recording to cloud storage
- [ ] Picture-in-picture mode
- [ ] Mobile app support

### Advanced Features
- [ ] AI noise cancellation
- [ ] Auto transcription
- [ ] Call analytics
- [ ] Breakout rooms
- [ ] Screen annotation tools

## Testing

### Local Testing (Same Network)
1. Open app in two different browsers
2. Login with different accounts
3. User A creates call, copies room ID
4. User B joins with room ID
5. Test all controls

### Remote Testing
1. Deploy to production (HTTPS required)
2. Share room link with remote user
3. Test across different networks
4. Verify STUN/TURN connectivity

## Performance Optimization

### Bandwidth Management
- Video resolution: 1280x720 (can be adjusted)
- Bitrate: Adaptive based on connection
- Screen share: Higher quality, lower FPS

### CPU Optimization
- Hardware acceleration enabled
- Lazy loading components
- Efficient peer cleanup

## API Reference

### useWebRTC Hook

```typescript
const {
  peers,              // Array of peer connections
  localStream,        // Local media stream
  screenStream,       // Screen sharing stream
  isScreenSharing,    // Boolean
  isRecording,        // Boolean
  isMuted,           // Boolean
  isVideoOff,        // Boolean
  toggleMute,        // Function
  toggleVideo,       // Function
  startScreenShare,  // Function
  stopScreenShare,   // Function
  startRecording,    // Function
  stopRecording      // Function
} = useWebRTC(roomId, userId);
```

### Socket Events

#### Client → Server
- `join-room` - Join a call room
- `sending-signal` - Send WebRTC offer
- `returning-signal` - Send WebRTC answer
- `start-screen-share` - Notify screen sharing started
- `stop-screen-share` - Notify screen sharing stopped

#### Server → Client
- `all-users` - List of users in room
- `user-joined` - New user joined
- `receiving-returned-signal` - WebRTC answer received
- `user-left` - User disconnected
- `user-started-screen-share` - User sharing screen
- `user-stopped-screen-share` - User stopped sharing

## License
Same as parent project

## Support
For issues or questions:
1. Check troubleshooting section
2. Review browser console for errors
3. Test with different browsers
4. Ensure all dependencies installed correctly

---

**Note**: This is a development implementation. For production use, implement proper security measures, authentication, and use commercial TURN servers for reliability.
