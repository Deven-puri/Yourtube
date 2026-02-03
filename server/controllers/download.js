import Download from "../Modals/download.js";
import User from "../Modals/Auth.js";
import Video from "../Modals/video.js";
import path from "path";
import fs from "fs";

// Check if user can download (premium or within daily limit)
export const checkDownloadLimit = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if user is premium
        if (user.isPremium && user.premiumExpiry > new Date()) {
            return res.status(200).json({ 
                canDownload: true, 
                isPremium: true,
                message: "Premium user - unlimited downloads"
            });
        }

        // Check daily download limit for free users
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastDownload = user.lastDownloadDate ? new Date(user.lastDownloadDate) : null;
        const lastDownloadDay = lastDownload ? new Date(lastDownload.setHours(0, 0, 0, 0)) : null;

        // Reset daily downloads if it's a new day
        if (!lastDownloadDay || lastDownloadDay < today) {
            user.dailyDownloads = 0;
            user.lastDownloadDate = new Date();
            await user.save();
        }

        const canDownload = user.dailyDownloads < 1;

        return res.status(200).json({
            canDownload,
            isPremium: false,
            downloadsToday: user.dailyDownloads,
            limit: 1,
            message: canDownload 
                ? "You can download 1 video today" 
                : "Daily download limit reached. Upgrade to premium for unlimited downloads."
        });

    } catch (error) {
        res.status(500).json({ message: "Error checking download limit", error: error.message });
    }
};

// Download video
export const downloadVideo = async (req, res) => {
    try {
        const { userId, videoId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const video = await Video.findById(videoId);
        if (!video) {
            return res.status(404).json({ message: "Video not found" });
        }

        // Check premium status
        const isPremium = user.isPremium && user.premiumExpiry > new Date();

        // Check daily download limit for free users
        if (!isPremium) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const lastDownload = user.lastDownloadDate ? new Date(user.lastDownloadDate) : null;
            const lastDownloadDay = lastDownload ? new Date(lastDownload.setHours(0, 0, 0, 0)) : null;

            // Reset daily downloads if it's a new day
            if (!lastDownloadDay || lastDownloadDay < today) {
                user.dailyDownloads = 0;
            }

            if (user.dailyDownloads >= 1) {
                return res.status(403).json({ 
                    message: "Daily download limit reached. Upgrade to premium for unlimited downloads.",
                    requiresPremium: true
                });
            }

            // Increment download count
            user.dailyDownloads += 1;
            user.lastDownloadDate = new Date();
            await user.save();
        }

        // Record the download
        const download = new Download({
            userId,
            videoId,
            downloadedAt: new Date()
        });
        await download.save();

        // Return video file path for download
        const videoPath = path.join(__dirname, "..", "uploads", video.videolink);
        
        if (!fs.existsSync(videoPath)) {
            return res.status(404).json({ message: "Video file not found on server" });
        }

        res.status(200).json({
            message: "Download recorded successfully",
            videoUrl: `/uploads/${video.videolink}`,
            videoTitle: video.videotitle,
            downloadId: download._id
        });

    } catch (error) {
        res.status(500).json({ message: "Error downloading video", error: error.message });
    }
};

// Get user's download history
export const getDownloads = async (req, res) => {
    try {
        const userId = req.params.userId;

        const downloads = await Download.find({ userId })
            .populate({
                path: "videoId",
                populate: {
                    path: "videochanel",
                    select: "name channelname image"
                }
            })
            .sort({ downloadedAt: -1 });

        res.status(200).json({ downloads });

    } catch (error) {
        res.status(500).json({ message: "Error fetching downloads", error: error.message });
    }
};

// Delete download record
export const deleteDownload = async (req, res) => {
    try {
        const { downloadId } = req.params;

        const download = await Download.findByIdAndDelete(downloadId);

        if (!download) {
            return res.status(404).json({ message: "Download record not found" });
        }

        res.status(200).json({ message: "Download record deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Error deleting download", error: error.message });
    }
};
