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
const PORT = process.env.PORT || 5000;

// WebRTC Signaling Logic
const users = {}; // userId -> socketId mapping
const socketToRoom = {}; // socketId -> roomId mapping

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins a call room
  socket.on('join-room', ({ roomId, userId }) => {
    if (!users[roomId]) {
      users[roomId] = [];
    }
    
    users[roomId].push({ userId, socketId: socket.id });
    socketToRoom[socket.id] = roomId;
    
    // Get other users in the room
    const otherUsers = users[roomId].filter(user => user.socketId !== socket.id);
    
    socket.join(roomId);
    socket.emit('all-users', otherUsers);
    
    console.log(`User ${userId} joined room ${roomId}`);
  });

  // WebRTC signaling - sending offer
  socket.on('sending-signal', ({ userToSignal, callerId, signal }) => {
    io.to(userToSignal).emit('user-joined', { signal, callerId });
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
    const roomId = socketToRoom[socket.id];
    
    if (roomId && users[roomId]) {
      users[roomId] = users[roomId].filter(user => user.socketId !== socket.id);
      
      if (users[roomId].length === 0) {
        delete users[roomId];
      } else {
        socket.to(roomId).emit('user-left', { userId: socket.id });
      }
    }
    
    delete socketToRoom[socket.id];
    console.log('User disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

const DBURL = process.env.DB_URL;
mongoose
  .connect(DBURL)
  .then(() => {
    console.log("Mongodb connected");
  })
  .catch((error) => {
    console.log(error);
  });
