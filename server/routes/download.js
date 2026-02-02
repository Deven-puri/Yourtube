const express = require("express");
const {
    checkDownloadLimit,
    downloadVideo,
    getDownloads,
    deleteDownload
} = require("../controllers/download");

const router = express.Router();

router.get("/check-limit/:userId", checkDownloadLimit);
router.post("/download/:userId/:videoId", downloadVideo);
router.get("/history/:userId", getDownloads);
router.delete("/delete/:downloadId", deleteDownload);

module.exports = router;
