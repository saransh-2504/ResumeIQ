import crypto from "crypto";
import redis from "../config/redis.js";
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Inline transporter — OTP emails are simple, no need to import sendEmail
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: Number(env.EMAIL_PORT),
  secure: Number(env.EMAIL_PORT) === 465,
  auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
});

async function sendOTPEmail(to, otp, userName) {
  await transporter.sendMail({
    from: `"ResumeIQ" <${env.EMAIL_USER}>`,
    to,
    subject: "ResumeIQ — Your Verification Code",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#4f46e5;margin-bottom:8px">ResumeIQ</h2>
        <p style="color:#374151">Hi ${userName || "there"},</p>
        <p style="color:#374151">Your verification code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#4f46e5;margin:24px 0;text-align:center">${otp}</div>
        <p style="color:#6b7280;font-size:13px">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `,
  });
}

const OTP_TTL = 5 * 60;        // 5 minutes in seconds
const MAX_ATTEMPTS = 3;         // max wrong guesses before lockout
const RESEND_COOLDOWN = 60;     // 60 seconds between resend requests

// Generate a 6-digit OTP
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Hash OTP before storing — so raw OTP is never in Redis
function hashOTP(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// Redis key helpers
const otpKey = (target) => `otp:${target}`;
const attemptsKey = (target) => `otp_attempts:${target}`;
const cooldownKey = (target) => `otp_cooldown:${target}`;

// ---- SEND OTP ----
// target = email address
// Returns { sent: true } or throws
export async function sendOTP(target, userName = "") {
  // Check resend cooldown — prevent spam
  const onCooldown = await redis.get(cooldownKey(target));
  if (onCooldown) {
    const ttl = await redis.ttl(cooldownKey(target));
    throw new Error(`Please wait ${ttl} seconds before requesting another OTP.`);
  }

  const otp = generateOTP();
  const hashed = hashOTP(otp);

  // Store hashed OTP with 5 min expiry
  await redis.setex(otpKey(target), OTP_TTL, hashed);

  // Reset attempt counter
  await redis.del(attemptsKey(target));

  // Set resend cooldown (60 sec)
  await redis.setex(cooldownKey(target), RESEND_COOLDOWN, "1");

  // Send OTP via email
  await sendOTPEmail(target, otp, userName);

  return { sent: true };
}

// ---- VERIFY OTP ----
// Returns { verified: true } or throws with reason
export async function verifyOTP(target, inputOtp) {
  const stored = await redis.get(otpKey(target));

  if (!stored) {
    throw new Error("OTP expired or not found. Please request a new one.");
  }

  // Track wrong attempts
  const attempts = parseInt((await redis.get(attemptsKey(target))) || "0");
  if (attempts >= MAX_ATTEMPTS) {
    // Delete OTP so they must request a new one
    await redis.del(otpKey(target));
    await redis.del(attemptsKey(target));
    throw new Error("Too many incorrect attempts. Please request a new OTP.");
  }

  const inputHashed = hashOTP(String(inputOtp).trim());

  if (inputHashed !== stored) {
    // Increment attempt counter (expires with OTP TTL)
    await redis.setex(attemptsKey(target), OTP_TTL, String(attempts + 1));
    const remaining = MAX_ATTEMPTS - attempts - 1;
    throw new Error(`Incorrect OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`);
  }

  // OTP correct — clean up Redis
  await redis.del(otpKey(target));
  await redis.del(attemptsKey(target));
  await redis.del(cooldownKey(target));

  return { verified: true };
}
