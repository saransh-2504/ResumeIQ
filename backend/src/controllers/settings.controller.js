import crypto from "crypto";
import User from "../models/User.js";
import { env } from "../config/env.js";
import axios from "axios";

async function sendMail({ to, subject, html }) {
  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    { sender: { email: env.EMAIL_USER, name: "ResumeIQ" }, to: [{ email: to }], subject, htmlContent: html },
    { headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json" } }
  );
}

async function sendMail({ to, subject, html }) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = { email: env.EMAIL_USER, name: "ResumeIQ" };
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  await apiInstance.sendTransacEmail(sendSmtpEmail);
}

// ---- GET MY PROFILE ----
export async function getMyProfile(req, res) {
  try {
    const user = await User.findById(req.user._id)
      .select("-password -verificationToken -passwordResetToken -emailChangeToken");
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch profile." });
  }
}

// ---- UPDATE NAME + PHONE ----
export async function updateBasicInfo(req, res) {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (name?.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone?.trim() || null;
    await user.save();
    res.status(200).json({ message: "Saved.", user: { name: user.name, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ message: "Failed to update." });
  }
}

// ---- CHANGE PASSWORD ----
export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Both fields required." });
    if (newPassword.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters." });

    const user = await User.findById(req.user._id);
    if (user.oauthProvider)
      return res.status(400).json({ message: "OAuth accounts cannot change password here." });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch)
      return res.status(401).json({ message: "Current password is incorrect." });

    user.password = newPassword;
    await user.save();
    res.status(200).json({ message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to change password." });
  }
}

// ---- REQUEST EMAIL CHANGE (candidate only) ----
export async function requestEmailChange(req, res) {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ message: "New email is required." });

    const existing = await User.findOne({ email: newEmail.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already in use." });

    const token = crypto.randomBytes(32).toString("hex");
    const user = await User.findById(req.user._id);
    user.pendingEmail = newEmail.toLowerCase();
    user.emailChangeToken = token;
    user.emailChangeExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const verifyUrl = `${env.CLIENT_URL}/verify-email-change?token=${token}`;
    await sendMail({
      to: newEmail,
      subject: "Confirm your new email — ResumeIQ",
      html: `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#4f46e5">ResumeIQ</h2>
        <p>Click below to confirm your new email address:</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Confirm Email</a>
        <p style="color:#9ca3af;font-size:12px;margin-top:16px">This link expires in 15 minutes.</p>
      </div>`,
    });

    res.status(200).json({ message: `Verification sent to ${newEmail}.` });
  } catch (err) {
    res.status(500).json({ message: "Failed to send verification." });
  }
}

// ---- CONFIRM EMAIL CHANGE ----
export async function confirmEmailChange(req, res) {
  try {
    const { token } = req.query;
    const user = await User.findOne({
      emailChangeToken: token,
      emailChangeExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: "Invalid or expired link." });

    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailChangeToken = undefined;
    user.emailChangeExpires = undefined;
    await user.save();
    res.status(200).json({ message: "Email updated successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to update email." });
  }
}

// ---- UPDATE RECRUITER COMPANY PROFILE ----
// Direct update — no admin approval needed
export async function updateRecruiterProfile(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (user.role !== "recruiter")
      return res.status(403).json({ message: "Not a recruiter account." });

    const { companyName, companyWebsite, companySize, industry, designation, companyDescription, companyLocation } = req.body;

    if (!companyName?.trim())
      return res.status(400).json({ message: "Company name is required." });

    user.recruiterProfile = {
      companyName: companyName.trim(),
      companyWebsite: companyWebsite?.trim() || "",
      companySize: companySize || "",
      industry: industry?.trim() || "",
      designation: designation?.trim() || "",
      companyDescription: companyDescription?.trim() || "",
      companyLocation: companyLocation?.trim() || "",
    };
    user.profileSetupDone = true;
    await user.save();

    res.status(200).json({ message: "Company profile updated.", recruiterProfile: user.recruiterProfile });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile." });
  }
}

// ---- DELETE ACCOUNT (candidate — direct) ----
export async function deleteAccount(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.role !== "candidate")
      return res.status(403).json({ message: "Use the request deletion flow for recruiter accounts." });

    // Delete resume from Cloudinary if exists
    try {
      const Resume = (await import("../models/Resume.js")).default;
      const cloudinary = (await import("../config/cloudinary.js")).default;
      const resume = await Resume.findOne({ userId: user._id });
      if (resume?.cloudinaryId) {
        await cloudinary.uploader.destroy(resume.cloudinaryId, { resource_type: "raw", type: "authenticated" });
        await resume.deleteOne();
      }
    } catch (e) { console.warn("Resume cleanup failed:", e.message); }

    await user.deleteOne();
    // Clear auth cookie
    res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: process.env.NODE_ENV === "production" ? "none" : "lax" });
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete account." });
  }
}

// ---- REQUEST ACCOUNT DELETION (recruiter) ----
export async function requestAccountDeletion(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.role !== "recruiter")
      return res.status(403).json({ message: "Candidates can delete directly." });

    user.deleteRequested = true;
    user.deleteRequestedAt = new Date();
    await user.save();

    res.status(200).json({ message: "Deletion request submitted. Admin will review it shortly." });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit deletion request." });
  }
}
