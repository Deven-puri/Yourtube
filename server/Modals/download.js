import mongoose from "mongoose";

const downloadSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "videofiles",
        required: true
    },
    downloadedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient queries
downloadSchema.index({ userId: 1, downloadedAt: -1 });
downloadSchema.index({ userId: 1, videoId: 1 });

export default mongoose.model("Download", downloadSchema);
