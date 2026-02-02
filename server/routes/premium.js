const express = require("express");
const {
    createPremiumOrder,
    verifyPayment,
    checkPremiumStatus,
    getWatchTimeStatus,
    updateWatchTime
} = require("../controllers/premium");

const router = express.Router();

router.post("/create-order", createPremiumOrder);
router.post("/verify-payment", verifyPayment);
router.get("/status/:userId", checkPremiumStatus);
router.get("/watch-time/:userId", getWatchTimeStatus);
router.post("/watch-time/:userId", updateWatchTime);

module.exports = router;
