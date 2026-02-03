
import express from "express";
import {
    createPremiumOrder,
    verifyPayment,
    checkPremiumStatus,
    getWatchTimeStatus,
    updateWatchTime
} from "../controllers/premium.js";

const router = express.Router();

router.post("/create-order", createPremiumOrder);
router.post("/verify-payment", verifyPayment);
router.get("/status/:userId", checkPremiumStatus);
router.get("/watch-time/:userId", getWatchTimeStatus);
router.post("/watch-time/:userId", updateWatchTime);

export default router;
