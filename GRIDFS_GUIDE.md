# GridFS Video Storage Guide

## 🎥 How GridFS Works in Your YouTube Clone

### What is GridFS?
GridFS is MongoDB's specification for storing and retrieving large files (videos, images, audio). It automatically splits files into chunks of 255KB and stores them across two collections:
- `videos.files` - File metadata (name, size, content type)
- `videos.chunks` - Actual file data in chunks

---

## 📤 How to Upload Videos

### Method 1: Using the Frontend UI (Recommended)

1. **Create a Channel First**
   - Click your profile avatar (top right)
   - Select "Create Channel"
   - Enter channel name

2. **Upload Video**
   - Go to "Your channel" from profile dropdown
   - Scroll to "Upload a video" section
   - Click or drag & drop video file (MP4, max 100MB)
   - Enter video title
   - Click "Upload"

### Method 2: Using API Directly (Postman/cURL)

```bash
curl -X POST http://localhost:5001/video/upload \
  -F "file=@/path/to/video.mp4" \
  -F "videotitle=My Video Title" \
  -F "videochanel=My Channel" \
  -F "uploader=USER_ID_HERE"
```

---

## 📥 How Videos Are Stored

### Backend Flow (server/controllers/video.js):

1. **Upload Request** → Multer receives file in memory
2. **GridFS Stream** → File buffer streams to MongoDB
3. **Chunking** → MongoDB automatically splits into 255KB chunks
4. **Metadata Save** → Video info saved to `videofiles` collection
5. **GridFS ID** → Unique file ID stored for retrieval

### Database Structure:
```
MongoDB Database:
├── videofiles (your video metadata)
│   └── {
│         _id: ObjectId("..."),
│         videotitle: "My Video",
│         filename: "timestamp-video.mp4",
│         gridfsId: ObjectId("..."),  ← Reference to GridFS
│         uploader: "user_id",
│         views: 0,
│         Like: 0
│       }
│
└── videos.files & videos.chunks (GridFS storage)
    ├── videos.files
    │   └── {
    │         _id: ObjectId("..."),
    │         length: 15728640,
    │         chunkSize: 261120,
    │         filename: "timestamp-video.mp4",
    │         contentType: "video/mp4"
    │       }
    └── videos.chunks
        └── [Multiple 255KB chunks of video data]
```

---

## 🎬 How to Fetch & Play Videos

### Frontend URLs (All Updated):

**Video Card (Homepage)**
```javascript
// OLD (file system):
src={`http://localhost:5001/${video.filepath}`}

// NEW (GridFS streaming):
src={`http://localhost:5001/video/stream/${video._id}`}
```

**Video Player**
```javascript
src={`http://localhost:5001/video/stream/${video._id}`}
```

### Backend Streaming (server/controllers/video.js):

```javascript
// GET /video/stream/:id
// 1. Find video by ID in videofiles collection
// 2. Get gridfsId from video document
// 3. Stream from GridFS using gridfsId
// 4. Support range requests for video seeking
```

---

## 🔄 Complete Video Flow

### Upload Flow:
```
User → VideoUploader.tsx
  ↓
FormData (file + metadata) → POST /video/upload
  ↓
Multer (memory storage) → controllers/video.js
  ↓
GridFS.openUploadStream() → MongoDB videos.chunks
  ↓
Save metadata → videofiles collection
  ↓
Response with videoId
```

### Playback Flow:
```
User clicks video → watch/[id]
  ↓
Video Player loads → src="/video/stream/:id"
  ↓
Backend finds video → Get gridfsId
  ↓
GridFS.openDownloadStream() → Stream chunks
  ↓
Support range requests → Video seeking works
  ↓
Browser plays video
```

---

## 🚀 API Endpoints

### 1. Upload Video
```http
POST /video/upload
Content-Type: multipart/form-data

Body:
- file: video file (required)
- videotitle: string (required)
- videochanel: string (required)
- uploader: user ID (required)

Response:
{
  "message": "Video uploaded successfully to MongoDB",
  "videoId": "65f...",
  "gridfsId": "65f..."
}
```

### 2. Get All Videos
```http
GET /video/getall

Response:
[
  {
    "_id": "65f...",
    "videotitle": "My Video",
    "filename": "1707123456-video.mp4",
    "gridfsId": "65f...",
    "videochanel": "My Channel",
    "uploader": "user_id",
    "views": 0,
    "Like": 0,
    "createdAt": "2026-02-05T..."
  }
]
```

### 3. Stream Video (GridFS)
```http
GET /video/stream/:id
Headers:
  Range: bytes=0-1023 (optional, for seeking)

Response:
- Video stream with proper range support
- Content-Type: video/mp4
- Content-Length: file size
- Accept-Ranges: bytes
```

---

## ✅ Current Implementation Status

### Backend (✅ Complete):
- ✅ GridFS initialized in index.js
- ✅ Video upload to MongoDB GridFS
- ✅ Video streaming with range support
- ✅ Video metadata in videofiles collection
- ✅ Proper error handling

### Frontend (✅ Updated):
- ✅ VideoCard uses streaming endpoint
- ✅ VideoPlayer uses streaming endpoint  
- ✅ Watch Later uses streaming endpoint
- ✅ Liked Videos uses streaming endpoint
- ✅ History uses streaming endpoint
- ✅ Upload component ready

---

## 🎯 How to Test

### 1. Check Server is Running:
```bash
# Terminal 1: Backend
cd server
npx nodemon index.js
# Should see: "✅ GridFS initialized for video storage"

# Terminal 2: Frontend
cd yourtube
npm run dev
```

### 2. Upload a Test Video:
- Go to http://localhost:3000
- Sign in → Create Channel → Upload Video
- Select any MP4 file < 100MB
- Wait for success message

### 3. Verify in MongoDB:
```javascript
// Connect to MongoDB
db.videofiles.find()  // Should show your video metadata
db.videos.files.find()  // Should show GridFS file
db.videos.chunks.find()  // Should show video chunks
```

### 4. Check Video Plays:
- Go to homepage
- Video card should appear
- Click video → Should play in video player

---

## 🌐 Production Deployment

### For Live Website:

1. **Set Environment Variable**:
```bash
# Frontend .env.local
NEXT_PUBLIC_BACKEND_URL=https://your-backend.com
```

2. **Backend Hosting**:
- Deploy to Heroku, Railway, or DigitalOcean
- Ensure MongoDB Atlas connection
- GridFS works same in production

3. **Frontend Hosting**:
- Deploy to Vercel/Netlify
- Update NEXT_PUBLIC_BACKEND_URL
- Videos stream from your MongoDB

### No File Storage Needed:
- ✅ No AWS S3 required
- ✅ No file system needed
- ✅ Everything in MongoDB
- ✅ Easy to backup and scale

---

## 🔧 Troubleshooting

### "No videos found" Issue:
1. Check MongoDB connection: `db.videofiles.find()`
2. Verify GridFS initialized: Check server logs for "✅ GridFS initialized"
3. Test upload: Use frontend upload or Postman
4. Check frontend API URL matches backend port (5001)

### Video Won't Play:
1. Check streaming endpoint: `http://localhost:5001/video/stream/VIDEO_ID`
2. Verify gridfsId exists in video document
3. Check browser console for CORS errors
4. Ensure video was uploaded successfully

### Upload Fails:
1. Check file size < 100MB
2. Verify multer is working: Check server logs
3. MongoDB connection active
4. GridFS initialized properly

---

## 💡 Key Benefits

1. **No File System** - Everything in database
2. **Scalable** - MongoDB handles chunking
3. **Streaming** - Supports video seeking/buffering
4. **Backup** - One database backup includes videos
5. **Cloud Ready** - Works on any MongoDB (Atlas, local)
6. **No CDN Needed** - MongoDB can stream directly

Your system is now production-ready for video storage! 🎉
