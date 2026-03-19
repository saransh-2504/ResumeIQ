import nodemailer from "nodemailer";
import { env } from "../config/env.js";

// Create transporter — works with Gmail (use App Password)
const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: false, // true for port 465, false for 587
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

// Professional verification email template
export async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"ResumeIQ" <${env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Verify your ResumeIQ account",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      </head>
      <body style="margin:0;padding:0;background:#F8FAFC;font-family:'Inter',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
                
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
                    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                      Resume<span style="color:#c4b5fd;">IQ</span>
                    </h1>
                    <p style="margin:8px 0 0;color:#c4b5fd;font-size:13px;">AI-Powered Resume Platform</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px 32px;">
                    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">
                      Verify your email address
                    </h2>
                    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                      Thanks for signing up! Click the button below to verify your email and activate your ResumeIQ account.
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:10px;">
                          <a href="${verifyUrl}"
                             style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:10px;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;">
                      Or copy this link into your browser:
                    </p>
                    <p style="margin:0;background:#f3f4f6;border-radius:8px;padding:10px 12px;font-size:11px;color:#6b7280;word-break:break-all;">
                      ${verifyUrl}
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #f3f4f6;text-align:center;">
                    <p style="margin:0;color:#d1d5db;font-size:11px;">
                      If you didn't create a ResumeIQ account, you can safely ignore this email.
                    </p>
                    <p style="margin:8px 0 0;color:#d1d5db;font-size:11px;">
                      © 2025 ResumeIQ. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}
