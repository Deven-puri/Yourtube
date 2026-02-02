const express = require("express");
const {
    createPremiumOrder,
    verifyPayment,
    checkPremiumStatus
} = require("../controllers/premium");

const router = express.Router();

router.post("/create-order", createPremiumOrder);
router.post("/verify-payment", verifyPayment);
router.get("/status/:userId", checkPremiumStatus);

module.exports = router;
