const User = require("../Modals/Auth");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { sendInvoiceEmail } = require("../services/emailService");

// Initialize Razorpay (use test keys for now)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_sample_key",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "sample_secret"
});

// Plan configurations
const PLANS = {
    Free: { price: 0, watchTime: 300, downloads: 1 },      // 5 minutes, 1 download
    Bronze: { price: 1000, watchTime: 420, downloads: 1 }, // 7 minutes (₹10 in paise)
    Silver: { price: 5000, watchTime: 600, downloads: 5 }, // 10 minutes (₹50 in paise)
    Gold: { price: 10000, watchTime: -1, downloads: -1 }   // Unlimited (₹100 in paise)
};

// Create Razorpay order for premium subscription
exports.createPremiumOrder = async (req, res) => {
    try {
        const { userId, plan } = req.body; // plan: Bronze, Silver, Gold

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get plan pricing
        const planConfig = PLANS[plan];
        if (!planConfig) {
            return res.status(400).json({ message: "Invalid plan selected" });
        }

        const amount = planConfig.price;

        // Create Razorpay order
        const options = {
            amount: amount, // amount in paise
            currency: "INR",
            receipt: `plan_${plan}_${userId}_${Date.now()}`,
            notes: {
                userId,
                plan,
                type: "plan_upgrade"
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

        // Activate plan for user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const planConfig = PLANS[plan];
        if (!planConfig) {
            return res.status(400).json({ message: "Invalid plan" });
        }

        // Update user's plan
        user.planType = plan;
        user.watchTimeLimit = planConfig.watchTime;
        user.isPremium = plan !== 'Free';
        
        // Set expiry (30 days from now for all paid plans)
        if (plan !== 'Free') {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            user.premiumExpiry = expiryDate;
        }

        await user.save();

        // Send invoice email
        const invoiceData = {
            name: user.name,
            email: user.email,
            planType: plan,
            amount: planConfig.price / 100, // Convert paise to rupees
            transactionId: razorpay_payment_id,
            date: new Date()
        };

        // Send email asynchronously (don't wait for it)
        sendInvoiceEmail(invoiceData).catch(err => 
            console.error('Failed to send invoice email:', err)
        );

        res.status(200).json({
            success: true,
            message: `${plan} plan activated successfully`,
            planType: plan,
            watchTimeLimit: planConfig.watchTime === -1 ? 'Unlimited' : `${planConfig.watchTime / 60} minutes`,
            premiumExpiry: user.premiumExpiry,
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
            planType: user.planType,
            watchTimeLimit: user.watchTimeLimit,
            totalWatchedTime: user.totalWatchedTime,
            premiumExpiry: user.premiumExpiry,
            daysRemaining: isPremiumActive 
                ? Math.ceil((user.premiumExpiry - new Date()) / (1000 * 60 * 60 * 24))
                : 0
        });

    } catch (error) {
        res.status(500).json({ message: "Error checking premium status", error: error.message });
    }
};

// Get watch time status
exports.getWatchTimeStatus = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Reset watch time if it's a new day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastReset = user.lastWatchReset ? new Date(user.lastWatchReset) : null;
        const lastResetDay = lastReset ? new Date(lastReset.setHours(0, 0, 0, 0)) : null;

        if (!lastResetDay || lastResetDay < today) {
            user.totalWatchedTime = 0;
            user.lastWatchReset = new Date();
            await user.save();
        }

        const remainingTime = user.watchTimeLimit === -1 
            ? -1 
            : Math.max(0, user.watchTimeLimit - user.totalWatchedTime);

        const canWatch = user.watchTimeLimit === -1 || remainingTime > 0;

        res.status(200).json({
            canWatch,
            planType: user.planType,
            watchTimeLimit: user.watchTimeLimit,
            totalWatchedTime: user.totalWatchedTime,
            remainingTime,
            isUnlimited: user.watchTimeLimit === -1
        });

    } catch (error) {
        res.status(500).json({ message: "Error getting watch time status", error: error.message });
    }
};

// Update watch time
exports.updateWatchTime = async (req, res) => {
    try {
        const { userId } = req.params;
        const { watchedSeconds } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Don't track for unlimited plans
        if (user.watchTimeLimit === -1) {
            return res.status(200).json({ 
                message: "Unlimited plan - no tracking needed",
                canContinue: true
            });
        }

        // Reset if new day
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastReset = user.lastWatchReset ? new Date(user.lastWatchReset) : null;
        const lastResetDay = lastReset ? new Date(lastReset.setHours(0, 0, 0, 0)) : null;

        if (!lastResetDay || lastResetDay < today) {
            user.totalWatchedTime = 0;
            user.lastWatchReset = new Date();
        }

        // Update watched time
        user.totalWatchedTime += Math.floor(watchedSeconds);
        await user.save();

        const remainingTime = Math.max(0, user.watchTimeLimit - user.totalWatchedTime);
        const canContinue = remainingTime > 0;

        res.status(200).json({
            success: true,
            totalWatchedTime: user.totalWatchedTime,
            remainingTime,
            canContinue,
            message: canContinue ? "Watch time updated" : "Watch time limit reached"
        });

    } catch (error) {
        res.status(500).json({ message: "Error updating watch time", error: error.message });
    }
};
