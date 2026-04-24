import axios from "axios";
import { env } from "../config/env.js";

// Brevo API — pure HTTP, no SDK needed 
// Works on all platforms including Render free tier
async function sendMail({ to, subject, html }) {
  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { email: env.EMAIL_USER, name: "ResumeIQ" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );
}

//  Verification email 
export async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
  await sendMail({
    to: toEmail,
    subject: "Verify your ResumeIQ account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#4f46e5">ResumeIQ</h2>
        <p>Thanks for signing up! Click below to verify your email. This link expires in <strong>10 minutes</strong>.</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Verify Email Address
        </a>
        <p style="color:#9ca3af;font-size:12px">Or copy: ${verifyUrl}</p>
        <p style="color:#d1d5db;font-size:11px">© 2026 ResumeIQ</p>
      </div>
    `,
  });
}

//  Password reset email 
export async function sendPasswordResetEmail(toEmail, token) {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
  await sendMail({
    to: toEmail,
    subject: "Reset your ResumeIQ password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#4f46e5">ResumeIQ</h2>
        <p>Click below to reset your password. This link expires in <strong>10 minutes</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#9ca3af;font-size:12px">Or copy: ${resetUrl}</p>
        <p style="color:#d1d5db;font-size:11px">© 2026 ResumeIQ</p>
      </div>
    `,
  });
}

// Recruiter approval email
export async function sendRecruiterApprovalEmail(toEmail, recruiterName, dashboardUrl) {
  await sendMail({
    to: toEmail,
    subject: "🎉 Your ResumeIQ recruiter account has been approved!",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#4f46e5">ResumeIQ</h2>
        <p>Hi ${recruiterName},</p>
        <p>Your recruiter account has been <strong style="color:#16a34a">approved</strong>! You can now post jobs and review applications.</p>
        <a href="${dashboardUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Complete Your Profile →
        </a>
        <p style="color:#d1d5db;font-size:11px">© 2026 ResumeIQ</p>
      </div>
    `,
  });
}
