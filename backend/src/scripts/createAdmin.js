/**
 * Creates or resets the admin user in the database.
 * Run once: node src/scripts/createAdmin.js
 *
 * Password must NOT contain # or @ — dotenv treats them as special characters.
 * Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before running.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log("✅ Connected to DB:", mongoose.connection.name);

const email = process.env.ADMIN_EMAIL || "admin@resumeiq.com";
const password = process.env.ADMIN_PASSWORD;

if (!password) {
  console.error("❌ ADMIN_PASSWORD not set in .env");
  process.exit(1);
}

// Hash manually — bypass mongoose pre-save hook to avoid double-hashing
const hashed = await bcrypt.hash(password, 10);

// Verify hash before saving
const check = await bcrypt.compare(password, hashed);
if (!check) {
  console.error("❌ Hash verification failed — aborting");
  process.exit(1);
}

// Raw collection update — no mongoose middleware involved
await mongoose.connection.collection("users").updateOne(
  { email },
  {
    $set: {
      name: "Admin",
      password: hashed,
      role: "admin",
      isVerified: true,
      isApproved: true,
      updatedAt: new Date(),
    },
    $setOnInsert: { createdAt: new Date() },
  },
  { upsert: true }
);

// Confirm it saved correctly
const saved = await mongoose.connection.collection("users").findOne({ email });
const finalCheck = await bcrypt.compare(password, saved.password);
console.log(finalCheck ? `✅ Admin ready — login with: ${email} / ${password}` : "❌ Something went wrong");

process.exit(0);
