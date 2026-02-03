import nodemailer from 'nodemailer';
import crypto from 'crypto';

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

// OTP expiry time (5 minutes)
const OTP_EXPIRY = 5 * 60 * 1000;

// Generate 6-digit OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Create email transporter
function createTransporter() {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

// Send Email OTP
async function sendEmailOTP(email) {
  const otp = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY;
  
  // Store OTP
  otpStore.set(email, { otp, expiresAt, type: 'email' });
  
  // If email credentials are not configured, just log the OTP (development mode)
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log(`\n📧 EMAIL OTP for ${email}: ${otp}`);
    console.log(`⏰ Expires in 5 minutes\n`);
    return { success: true, message: 'OTP logged to console (dev mode)', otp };
  }
  
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: `"YouTube Clone" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for YouTube Clone Login',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p style="font-size: 16px; color: #555;">Your OTP for login is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; border-radius: 5px;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #777; margin-top: 20px;">This OTP will expire in 5 minutes.</p>
          <p style="font-size: 14px; color: #777;">If you didn't request this, please ignore this email.</p>
        </div>
      `
    });
    
    console.log(`📧 Email OTP sent to ${email}`);
    return { success: true, message: 'OTP sent to email' };
  } catch (error) {
    console.error('Email send error:', error);
    // Fallback to console in case of email error
    console.log(`\n📧 EMAIL OTP for ${email}: ${otp} (Email failed, showing in console)`);
    return { success: true, message: 'OTP logged to console (email failed)', otp };
  }
}

// Send Phone OTP (Simulated - requires Twilio/Firebase in production)
async function sendPhoneOTP(phone) {
  const otp = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRY;
  
  // Store OTP
  otpStore.set(phone, { otp, expiresAt, type: 'phone' });
  
  // Simulate SMS sending (log to console)
  console.log(`\n📱 PHONE OTP for ${phone}: ${otp}`);
  console.log(`⏰ Expires in 5 minutes`);
  console.log(`💡 Note: This is simulated. Integrate Twilio/Firebase for real SMS.\n`);
  
  return { success: true, message: 'OTP sent to phone (simulated)', otp };
}

// Verify OTP
function verifyOTP(identifier, otp) {
  const storedData = otpStore.get(identifier);
  
  if (!storedData) {
    return { success: false, message: 'No OTP found. Please request a new one.' };
  }
  
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(identifier);
    return { success: false, message: 'OTP has expired. Please request a new one.' };
  }
  
  if (storedData.otp !== otp) {
    return { success: false, message: 'Invalid OTP. Please try again.' };
  }
  
  // OTP verified successfully, remove from store
  otpStore.delete(identifier);
  return { success: true, message: 'OTP verified successfully' };
}

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export {
  sendEmailOTP,
  sendPhoneOTP,
  verifyOTP
};
