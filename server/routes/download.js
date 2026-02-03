
import express from "express";
import {
    checkDownloadLimit,
    downloadVideo,
    getDownloads,
    deleteDownload
} from "../controllers/download.js";

const router = express.Router();

router.get("/check-limit/:userId", checkDownloadLimit);
router.post("/download/:userId/:videoId", downloadVideo);
router.get("/history/:userId", getDownloads);
router.delete("/delete/:downloadId", deleteDownload);

export default router;
