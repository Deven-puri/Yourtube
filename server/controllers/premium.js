const User = require("../Modals/Auth");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay (use test keys for now)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_sample_key",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "sample_secret"
});

// Create Razorpay order for premium subscription
exports.createPremiumOrder = async (req, res) => {
    try {
        const { userId, plan } = req.body; // plan can be "monthly" or "yearly"

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Define pricing
        const pricing = {
            monthly: 9900, // ₹99 in paise
            yearly: 99900  // ₹999 in paise
        };

        const amount = pricing[plan] || pricing.monthly;

        // Create Razorpay order
        const options = {
            amount: amount, // amount in paise
            currency: "INR",
            receipt: `premium_${userId}_${Date.now()}`,
            notes: {
                userId,
                plan,
                type: "premium_subscription"
            }
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_sample_key"
        });

    } catch (error) {
        res.status(500).json({ message: "Error creating order", error: error.message });
    }
};

// Verify payment and activate premium
exports.verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            userId,
            plan
        } = req.body;

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "sample_secret")
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (!isAuthentic) {
            return res.status(400).json({ 
                success: false,
                message: "Payment verification failed" 
            });
        }

        // Activate premium for user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Calculate expiry date based on plan
        const expiryDate = new Date();
        if (plan === "yearly") {
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else {
            expiryDate.setMonth(expiryDate.getMonth() + 1);
        }

        user.isPremium = true;
        user.premiumExpiry = expiryDate;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Premium activated successfully",
            premiumExpiry: expiryDate,
            paymentId: razorpay_payment_id
        });

    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: "Error verifying payment", 
            error: error.message 
        });
    }
};

// Check premium status
exports.checkPremiumStatus = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPremiumActive = user.isPremium && user.premiumExpiry > new Date();

        res.status(200).json({
            isPremium: isPremiumActive,
            premiumExpiry: user.premiumExpiry,
            daysRemaining: isPremiumActive 
                ? Math.ceil((user.premiumExpiry - new Date()) / (1000 * 60 * 60 * 24))
                : 0
        });

    } catch (error) {
        res.status(500).json({ message: "Error checking premium status", error: error.message });
    }
};
