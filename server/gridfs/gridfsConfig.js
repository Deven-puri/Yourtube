import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let gridfsBucket;

// Initialize GridFS bucket after MongoDB connection
export const initGridFS = () => {
  const db = mongoose.connection.db;
  gridfsBucket = new GridFSBucket(db, {
    bucketName: "videos" // Collection name will be videos.files and videos.chunks
  });
  console.log("✅ GridFS initialized for video storage");
  return gridfsBucket;
};

// Get GridFS bucket instance
export const getGridFSBucket = () => {
  if (!gridfsBucket) {
    throw new Error("GridFS not initialized. Call initGridFS() first.");
  }
  return gridfsBucket;
};

export default { initGridFS, getGridFSBucket };
