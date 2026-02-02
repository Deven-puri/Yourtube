import mongoose from "mongoose";
const userschema = mongoose.Schema({
  email: { type: String, required: true },
  name: { type: String },
  channelname: { type: String },
  description: { type: String },
  image: { type: String },
  joinedon: { type: Date, default: Date.now },
  isPremium: { type: Boolean, default: false },
  premiumExpiry: { type: Date, default: null },
  dailyDownloads: { type: Number, default: 0 },
  lastDownloadDate: { type: Date, default: null },
  planType: { type: String, enum: ['Free', 'Bronze', 'Silver', 'Gold'], default: 'Free' },
  watchTimeLimit: { type: Number, default: 300 }, // seconds (5 minutes for Free)
  totalWatchedTime: { type: Number, default: 0 }, // total seconds watched today
  lastWatchReset: { type: Date, default: Date.now },
});

export default mongoose.model("user", userschema);
