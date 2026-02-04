import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import { sendEmailOTP, sendPhoneOTP, verifyOTP } from "../services/otpService.js";

// South Indian states for region-based auth
const SOUTH_INDIAN_STATES = ['Tamil Nadu', 'Kerala', 'Karnataka', 'Andhra Pradesh', 'Telangana'];

/**
 * Request OTP - Send OTP via email or phone based on region
 */
export const requestOTP = async (req, res) => {
  const { email, phone, state } = req.body;

  try {
    const isSouthIndia = SOUTH_INDIAN_STATES.includes(state);
    
    // South India → Email OTP, Others → Phone OTP
    if (isSouthIndia && email) {
      const result = await sendEmailOTP(email);
      return res.status(200).json({ 
        ...result, 
        authType: 'email',
        message: 'OTP sent to your email address',
        // In development, return OTP for testing
        ...(process.env.NODE_ENV === 'development' && result.otp && { otp: result.otp })
      });
    } else if (!isSouthIndia && phone) {
      const result = await sendPhoneOTP(phone);
      return res.status(200).json({ 
        ...result, 
        authType: 'phone',
        message: 'OTP sent to your phone number (simulated)',
        // In development, return OTP for testing
        ...(process.env.NODE_ENV === 'development' && result.otp && { otp: result.otp })
      });
    } else {
      return res.status(400).json({ 
        message: 'Invalid request. Provide email for South India or phone for other regions.' 
      });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ 
      message: 'Failed to send OTP',
      error: error.message 
    });
  }
};

/**
 * Verify OTP and Login
 */
export const verifyOTPAndLogin = async (req, res) => {
  const { email, phone, otp, name, state } = req.body;

  try {
    const identifier = email || phone;
    
    if (!identifier || !otp) {
      return res.status(400).json({ message: 'Email/Phone and OTP are required' });
    }

    // Verify OTP
    const verification = verifyOTP(identifier, otp);
    
    if (!verification.success) {
      return res.status(400).json({ message: verification.message });
    }

    // OTP verified, now create/find user
    const existingUser = email 
      ? await users.findOne({ email })
      : await users.findOne({ phone });

    if (!existingUser) {
      // Create new user
      const userData = {
        name: name || 'User',
        image: 'https://github.com/shadcn.png',
        // Email is required by schema, so use phone@placeholder if only phone provided
        email: email || `${phone}@phone.user`
      };
      
      if (phone) userData.phone = phone;
      
      const newUser = await users.create(userData);
      return res.status(201).json({ 
        result: newUser,
        message: 'Account created and logged in successfully'
      });
    } else {
      // User exists, log them in
      return res.status(200).json({ 
        result: existingUser,
        message: 'Logged in successfully'
      });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ 
      message: 'Login failed',
      error: error.message 
    });
  }
};

/**
 * Firebase authentication - Create or update user from Firebase Auth
 */
export const firebaseAuth = async (req, res) => {
  const { uid, email, phone, name, image, photoURL } = req.body;

  try {
    if (!uid) {
      return res.status(400).json({ message: 'Firebase UID is required' });
    }

    // Find user by Firebase UID or email/phone
    let existingUser;
    if (email) {
      existingUser = await users.findOne({ email });
    } else if (phone) {
      existingUser = await users.findOne({ phone });
    }

    if (!existingUser) {
      // Create new user
      const newUser = await users.create({ 
        email: email || `${uid}@firebase.user`,
        name: name || 'User',
        image: image || photoURL || 'https://github.com/shadcn.png',
        phone: phone || null,
        firebaseUid: uid
      });
      return res.status(201).json({ 
        result: newUser,
        message: 'Account created successfully'
      });
    } else {
      // Update existing user with Firebase UID if not set
      if (!existingUser.firebaseUid) {
        existingUser.firebaseUid = uid;
      }
      // Update phone if provided and not already set
      if (phone && !existingUser.phone) {
        existingUser.phone = phone;
      }
      // Update email if provided and not already set
      if (email && !existingUser.email) {
        existingUser.email = email;
      }
      await existingUser.save();
      
      return res.status(200).json({ 
        result: existingUser,
        message: 'Logged in successfully'
      });
    }
  } catch (error) {
    console.error('Error in Firebase auth:', error);
    return res.status(500).json({ 
      message: 'Authentication failed',
      error: error.message 
    });
  }
};

export const login = async (req, res) => {
  const { email, name, image } = req.body;

  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error("MongoDB is not connected. Please whitelist your IP in MongoDB Atlas.");
      return res.status(503).json({ 
        message: "Database connection unavailable. Please whitelist your IP in MongoDB Atlas.",
        details: "Go to MongoDB Atlas → Network Access → Add IP Address"
      });
    }

    const existingUser = await users.findOne({ email });

    if (!existingUser) {
      const newUser = await users.create({ email, name, image });
      return res.status(201).json({ result: newUser });
    } else {
      return res.status(200).json({ result: existingUser });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};
export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
