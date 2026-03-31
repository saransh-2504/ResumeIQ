import { createRequire } from "module";
const require = createRequire(import.meta.url);
const SibApiV3Sdk = require("@getbrevo/brevo");
import { env } from "../config/env.js";

// ---- Brevo API client setup ----
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;

const FROM = { email: env.EMAIL_USER, name: "ResumeIQ" };

async function sendMail({ to, subject, html }) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.sender = FROM;
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  await apiInstance.sendTransacEmail(sendSmtpEmail);
}

// ---- Verification email ----
export async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;
  await sendMail({
    to: toEmail,
    subject: "Verify your ResumeIQ account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#4f46e5">ResumeIQ</h2>
        <p>Thanks for signing up! Click below to verify your email:</p>
        <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Verify Email Address
        </a>
        <p style="color:#9ca3af;font-size:12px">Or copy: ${verifyUrl}</p>
        <p style="color:#d1d5db;font-size:11px">© 2026 ResumeIQ</p>
      </div>
    `,
  });
}

// ---- Password reset email ----
export async function sendPasswordResetEmail(toEmail, token) {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
  await sendMail({
    to: toEmail,
    subject: "Reset your ResumeIQ password",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#4f46e5">ResumeIQ</h2>
        <p>Click below to reset your password. This link expires in 15 minutes.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Reset Password
        </a>
        <p style="color:#9ca3af;font-size:12px">Or copy: ${resetUrl}</p>
        <p style="color:#d1d5db;font-size:11px">© 2026 ResumeIQ</p>
      </div>
    `,
  });
}

// ---- Recruiter approval email ----
export async function sendRecruiterApprovalEmail(toEmail, recruiterName, dashboardUrl) {
  await sendMail({
    to: toEmail,
    subject: "🎉 Your ResumeIQ recruiter account has been approved!",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px">
        <h2 style="color:#4f46e5">ResumeIQ</h2>
        <p>Hi ${recruiterName},</p>
        <p>Your recruiter account has been <strong style="color:#16a34a">approved</strong>! You can now post jobs and review applications.</p>
        <p>Please complete your company profile before posting your first job.</p>
        <a href="${dashboardUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Complete Your Profile →
        </a>
        <div style="background:#f9fafb;border-radius:8px;padding:12px;margin-top:16px;font-size:12px;color:#6b7280">
          <strong>Terms reminder:</strong> Post only genuine jobs. Do not misuse candidate data. Violations may result in account suspension.
        </div>
        <p style="color:#d1d5db;font-size:11px;margin-top:16px">© 2026 ResumeIQ</p>
      </div>
    `,
  });
}
