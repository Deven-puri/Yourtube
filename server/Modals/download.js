const mongoose = require("mongoose");

const downloadSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
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

module.exports = mongoose.model("Download", downloadSchema);
