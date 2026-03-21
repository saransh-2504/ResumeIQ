/**
 * Run this script once to create an admin user in the database.
 * Usage: node src/scripts/createAdmin.js
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

// Connect to MongoDB
await mongoose.connect(process.env.MONGO_URI);
console.log("✅ Connected to MongoDB");

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  isVerified: Boolean,
  isApproved: Boolean,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);

// ---- CHANGE THESE VALUES ----
const ADMIN_NAME = "Admin";
const ADMIN_EMAIL = "admin@resumeiq.com";   // change this
const ADMIN_PASSWORD = "admin123";           // change this
// -----------------------------

const existing = await User.findOne({ email: ADMIN_EMAIL });
if (existing) {
  console.log("⚠️  Admin already exists with this email.");
  process.exit(0);
}

const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

await User.create({
  name: ADMIN_NAME,
  email: ADMIN_EMAIL,
  password: hashed,
  role: "admin",
  isVerified: true,
  isApproved: true,
});

console.log(`✅ Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
process.exit(0);
