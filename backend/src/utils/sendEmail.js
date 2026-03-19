import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Create a transporter using env credentials
// In dev, you can use Mailtrap or Gmail
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

// Send a verification email with a link
export async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"ResumeIQ" <${env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Verify your ResumeIQ account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2 style="color: #4f46e5;">Welcome to ResumeIQ</h2>
        <p>Click the button below to verify your email address.</p>
        <a href="${verifyUrl}" 
           style="display:inline-block; background:#4f46e5; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
          Verify Email
        </a>
        <p style="color:#999; font-size:12px; margin-top:16px;">
          If you didn't create an account, ignore this email.
        </p>
      </div>
    `,
  });
}
