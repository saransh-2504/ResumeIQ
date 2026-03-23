import cloudinary from "../config/cloudinary.js";
import Resume from "../models/Resume.js";
import { parseResumeFromUrl } from "../utils/parseResume.js";
import { sendOTP, verifyOTP } from "../utils/otp.js";

// ---- Upload buffer to Cloudinary (private/authenticated) ----
function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "resumeiq/resumes",
        public_id: filename,
        resource_type: "raw",
        overwrite: true,
        type: "authenticated", // private — no public URL
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// ---- Generate signed URL (15 min expiry) ----
export function generateSignedUrl(cloudinaryId) {
  return cloudinary.utils.private_download_url(cloudinaryId, "", {
    resource_type: "raw",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 15 * 60,
  });
}

// ---- Generate a URL for parser to fetch the file (10 min) ----
function generateParseUrl(cloudinaryId) {
  return cloudinary.utils.private_download_url(cloudinaryId, "", {
    resource_type: "raw",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 10 * 60,
  });
}

// ============================================================
// POST /api/v1/resume — Upload + parse synchronously
// ============================================================
export async function uploadResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const userId = req.user._id;
    const file = req.file;

    // Delete old Cloudinary file if replacing
    const existing = await Resume.findOne({ userId });
    if (existing?.cloudinaryId) {
      await cloudinary.uploader.destroy(existing.cloudinaryId, {
        resource_type: "raw",
        type: "authenticated",
      });
    }

    // Upload to Cloudinary
    const filename = `resume_${userId}_${Date.now()}`;
    const uploadResult = await uploadToCloudinary(file.buffer, filename);

    // Parse synchronously — wait for result before saving
    // This ensures parsedData is always available immediately after upload
    const parseUrl = generateParseUrl(uploadResult.public_id);
    let parsedData = null;
    try {
      parsedData = await parseResumeFromUrl(parseUrl, file.originalname);
    } catch (parseErr) {
      console.warn("Parse failed (non-fatal):", parseErr.message);
    }

    // Save everything in one shot — parsed data included
    const resume = await Resume.findOneAndUpdate(
      { userId },
      {
        userId,
        cloudinaryId: uploadResult.public_id,
        fileName: file.originalname,
        uploadedAt: new Date(),
        contactVerified: false,
        verifiedContact: null,
        parsedData: parsedData || null,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "Resume uploaded successfully.",
      resume: {
        fileName: resume.fileName,
        uploadedAt: resume.uploadedAt,
        contactVerified: resume.contactVerified,
        parsedData: resume.parsedData,
      },
    });
  } catch (err) {
    console.error("Resume upload error:", err.message);
    res.status(500).json({ message: "Failed to upload resume." });
  }
}

// ============================================================
// GET /api/v1/resume
// Returns resume info + parsed data + fresh signed URL
// ============================================================
export async function getMyResume(req, res) {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });

    if (!resume) {
      return res.status(404).json({ message: "No resume uploaded yet." });
    }

    const signedUrl = generateSignedUrl(resume.cloudinaryId);

    res.status(200).json({
      resume: {
        fileUrl: signedUrl,
        fileName: resume.fileName,
        uploadedAt: resume.uploadedAt,
        parsedData: resume.parsedData || null,
        contactVerified: resume.contactVerified,
        verifiedContact: resume.verifiedContact,
      },
    });
  } catch (err) {
    console.error("Get resume error:", err.message);
    res.status(500).json({ message: "Failed to fetch resume." });
  }
}

// ============================================================
// DELETE /api/v1/resume
// ============================================================
export async function deleteResume(req, res) {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });

    if (!resume) {
      return res.status(404).json({ message: "No resume found." });
    }

    await cloudinary.uploader.destroy(resume.cloudinaryId, {
      resource_type: "raw",
      type: "authenticated",
    });

    await resume.deleteOne();
    res.status(200).json({ message: "Resume deleted." });
  } catch (err) {
    console.error("Delete resume error:", err.message);
    res.status(500).json({ message: "Failed to delete resume." });
  }
}

// ============================================================
// POST /api/v1/resume/reparse
// Re-triggers parsing for the current resume (useful if parse failed)
// ============================================================
export async function reparseResume(req, res) {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: "No resume found. Please upload first." });
    }

    const parseUrl = generateParseUrl(resume.cloudinaryId);
    let parsedData = null;
    try {
      parsedData = await parseResumeFromUrl(parseUrl, resume.fileName);
    } catch (parseErr) {
      console.warn("Re-parse failed:", parseErr.message);
    }

    if (!parsedData) {
      return res.status(500).json({ message: "Could not parse resume. Please try re-uploading." });
    }

    resume.parsedData = parsedData;
    await resume.save();

    res.status(200).json({
      message: "Resume re-parsed successfully.",
      parsedData,
    });
  } catch (err) {
    console.error("Reparse error:", err.message);
    res.status(500).json({ message: "Failed to re-parse resume." });
  }
}

// ============================================================
// POST /api/v1/resume/send-otp
// Auto-matches resume email with logged-in user email
// If they match → send OTP automatically
// If they don't match → return error (no manual input allowed)
// ============================================================
export async function sendContactOTP(req, res) {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: "No resume found. Please upload first." });
    }

    // Parsing still in progress
    if (!resume.parsedData) {
      return res.status(400).json({ message: "Resume is still being parsed. Please wait a moment and try again." });
    }

    const parsedEmail = resume.parsedData.email?.toLowerCase().trim();
    const accountEmail = req.user.email?.toLowerCase().trim();

    // No email found in resume
    if (!parsedEmail) {
      return res.status(400).json({
        message: "No email found in your resume. Please add your email to your resume and re-upload.",
        noEmailInResume: true,
      });
    }

    // Emails don't match — block it
    if (parsedEmail !== accountEmail) {
      return res.status(400).json({
        message: `Email in your resume (${parsedEmail}) does not match your account email (${accountEmail}). Please update your resume with the correct email.`,
        emailMismatch: true,
        parsedEmail,
        accountEmail,
      });
    }

    // Emails match — send OTP automatically to account email
    await sendOTP(accountEmail, req.user.name);

    res.status(200).json({
      message: `OTP sent to ${accountEmail}. Valid for 5 minutes.`,
      contact: accountEmail,
    });
  } catch (err) {
    res.status(429).json({ message: err.message });
  }
}

// ============================================================
// POST /api/v1/resume/verify-otp
// Body: { otp } — contact is taken from logged-in user's email (no manual input)
// ============================================================
export async function verifyContactOTP(req, res) {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required." });
    }

    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: "No resume found." });
    }

    // Always verify against the logged-in user's account email
    const contact = req.user.email;

    await verifyOTP(contact, otp);

    resume.contactVerified = true;
    resume.verifiedContact = contact;
    await resume.save();

    res.status(200).json({
      message: "Contact verified successfully.",
      contactVerified: true,
      verifiedContact: contact,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
