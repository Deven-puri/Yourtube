import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import downloadroutes from "./routes/download.js";
import premiumroutes from "./routes/premium.js";
import subscriptionroutes from "./routes/subscription.js";
import { initGridFS } from "./gridfs/gridfsConfig.js";
dotenv.config();
const app = express();
const httpServer = createServer(app);
import path from "path";

// CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5001'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Socket.io setup for WebRTC signaling
const io = new Server(httpServer, {
  cors: corsOptions
});
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/uploads", express.static(path.join("uploads")));
app.get("/", (req, res) => {
  res.send("You tube backend is working");
});
app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/download", downloadroutes);
app.use("/premium", premiumroutes);
app.use("/subscription", subscriptionroutes);
const PORT = process.env.PORT || 5001;

// WebRTC Signaling Logic
const rooms = {}; // roomId -> array of users

io.on('connection', (socket) => {

  // User joins a call room
  socket.on('join-room', ({ roomId, userId }) => {
    // Initialize room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }
    
    // Check if user already in room (prevent duplicates)
    const existingUser = rooms[roomId].find(u => u.socketId === socket.id);
    if (existingUser) {
      return;
    }
    
    // Add user to room
    rooms[roomId].push({ userId, socketId: socket.id });
    socket.join(roomId);
    
    // Get other users in the room (exclude current user)
    const otherUsers = rooms[roomId].filter(user => user.socketId !== socket.id);
    
    // Send list of other users to the new joiner
    socket.emit('all-users', otherUsers);
    
  });

  // WebRTC signaling - sending offer
  socket.on('sending-signal', ({ userToSignal, callerId, signal }) => {
    
    // Find the caller's userId from rooms
    let callerUserId = null;
    Object.values(rooms).forEach(room => {
      const caller = room.find(user => user.socketId === socket.id);
      if (caller) {
        callerUserId = caller.userId;
      }
    });
    
    io.to(userToSignal).emit('user-joined', { 
      signal, 
      callerId,
      userId: callerUserId 
    });
  });

  // WebRTC signaling - returning answer
  socket.on('returning-signal', ({ callerSocketId, signal }) => {
    io.to(callerSocketId).emit('receiving-returned-signal', { signal, id: socket.id });
  });

  // Screen sharing started
  socket.on('start-screen-share', ({ roomId }) => {
    socket.to(roomId).emit('user-started-screen-share', { userId: socket.id });
  });

  // Screen sharing stopped
  socket.on('stop-screen-share', ({ roomId }) => {
    socket.to(roomId).emit('user-stopped-screen-share', { userId: socket.id });
  });

  // User leaves call
  socket.on('disconnect', () => {
    
    // Find and remove user from all rooms
    Object.keys(rooms).forEach(roomId => {
      const userIndex = rooms[roomId].findIndex(user => user.socketId === socket.id);
      
      if (userIndex !== -1) {
        rooms[roomId].splice(userIndex, 1);
        
        // Notify others in the room
        socket.to(roomId).emit('user-left', { userId: socket.id });
        
        
        // Clean up empty rooms
        if (rooms[roomId].length === 0) {
          delete rooms[roomId];
        }
      }
    });
  });
});

httpServer.listen(PORT, () => {
});

const DBURL = process.env.DB_URL;
mongoose
  .connect(DBURL)
  .then(() => {
    // Initialize GridFS after MongoDB connection
    initGridFS();
  })
  .catch((error) => {
  });
