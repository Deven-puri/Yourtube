import video from "../Modals/video.js";
import multer from "multer";
import { Readable } from "stream";
import { getGridFSBucket } from "../gridfs/gridfsConfig.js";

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "video/mp4" || file.mimetype.startsWith("video/")) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed!"), false);
  }
};

export const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

export const uploadvideo = async (req, res) => {
  if (!req.file) {
    return res.status(404).json({ message: "Please upload a video file" });
  }

  try {
    const gridfsBucket = getGridFSBucket();
    
    // Create a readable stream from the buffer
    const readableStream = Readable.from(req.file.buffer);
    
    // Generate unique filename
    const filename = `${Date.now()}-${req.file.originalname}`;
    
    // Create upload stream to GridFS
    const uploadStream = gridfsBucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
      metadata: {
        videotitle: req.body.videotitle,
        videochanel: req.body.videochanel,
        uploader: req.body.uploader,
        uploadedAt: new Date()
      }
    });

    // Pipe the file buffer to GridFS
    readableStream.pipe(uploadStream);

    uploadStream.on('error', (error) => {
      return res.status(500).json({ message: "Error uploading video to database" });
    });

    uploadStream.on('finish', async () => {
      // Save video metadata to your video collection
      const file = new video({
        videotitle: req.body.videotitle,
        filename: filename,
        filepath: uploadStream.id.toString(), // Store GridFS file ID
        filetype: req.file.mimetype,
        filesize: req.file.size.toString(),
        videochanel: req.body.videochanel,
        uploader: req.body.uploader,
        gridfsId: uploadStream.id, // Store GridFS ID for retrieval
        duration: parseInt(req.body.duration) || 0 // Store video duration
      });

      await file.save();
      
      return res.status(201).json({ 
        message: "Video uploaded successfully to MongoDB",
        videoId: file._id,
        gridfsId: uploadStream.id
      });
    });

  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};
export const getallvideo = async (req, res) => {
  try {
    const files = await video.find();
    return res.status(200).send(files);
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Stream video from GridFS
export const streamvideo = async (req, res) => {
  try {
    const { id } = req.params;
    const gridfsBucket = getGridFSBucket();

    // Find video metadata
    const videoDoc = await video.findById(id);
    if (!videoDoc || !videoDoc.gridfsId) {
      return res.status(404).json({ message: "Video not found" });
    }

    const range = req.headers.range;
    
    // Get file info from GridFS
    const files = await gridfsBucket.find({ _id: videoDoc.gridfsId }).toArray();
    
    if (!files || files.length === 0) {
      return res.status(404).json({ message: "Video file not found in database" });
    }

    const file = files[0];
    const fileSize = file.length;

    if (range) {
      // Parse range header for video streaming
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": file.contentType || "video/mp4",
      });

      const downloadStream = gridfsBucket.openDownloadStream(videoDoc.gridfsId, {
        start,
        end: end + 1
      });

      downloadStream.pipe(res);
    } else {
      // No range, send entire file
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": file.contentType || "video/mp4",
      });

      const downloadStream = gridfsBucket.openDownloadStream(videoDoc.gridfsId);
      downloadStream.pipe(res);
    }

  } catch (error) {
    return res.status(500).json({ message: "Error streaming video" });
  }
};
