import cloudinary from "../config/cloudinary.js";
import Resume from "../models/Resume.js";

// Upload buffer to Cloudinary as "authenticated" — not publicly accessible
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

// Generate a signed URL valid for 15 minutes
// This is called fresh every time user requests their resume
function generateSignedUrl(cloudinaryId) {
  return cloudinary.utils.private_download_url(
    cloudinaryId,
    "", // no forced extension — Cloudinary uses original
    {
      resource_type: "raw",
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 15 * 60, // 15 min
    }
  );
}

// ---- UPLOAD RESUME ----
export async function uploadResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const userId = req.user._id;
    const file = req.file;

    // If user already has a resume, delete old one from Cloudinary first
    const existing = await Resume.findOne({ userId });
    if (existing?.cloudinaryId) {
      await cloudinary.uploader.destroy(existing.cloudinaryId, {
        resource_type: "raw",
        type: "authenticated",
      });
    }

    const filename = `resume_${userId}_${Date.now()}`;
    const result = await uploadToCloudinary(file.buffer, filename);

    // Store only cloudinaryId in DB — NOT the URL
    // URL is generated fresh on every request (signed, expires in 15 min)
    const resume = await Resume.findOneAndUpdate(
      { userId },
      {
        userId,
        cloudinaryId: result.public_id,
        fileName: file.originalname,
        uploadedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "Resume uploaded successfully.",
      resume: {
        fileName: resume.fileName,
        uploadedAt: resume.uploadedAt,
      },
    });
  } catch (err) {
    console.error("Resume upload error:", err.message);
    res.status(500).json({ message: "Failed to upload resume." });
  }
}

// ---- GET MY RESUME ----
// Returns a fresh signed URL valid for 15 minutes — expires automatically
export async function getMyResume(req, res) {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });

    if (!resume) {
      return res.status(404).json({ message: "No resume uploaded yet." });
    }

    // Generate fresh signed URL on every request
    const signedUrl = generateSignedUrl(resume.cloudinaryId);

    res.status(200).json({
      resume: {
        fileUrl: signedUrl,        // temporary URL, expires in 15 min
        fileName: resume.fileName,
        uploadedAt: resume.uploadedAt,
      },
    });
  } catch (err) {
    console.error("Get resume error:", err.message);
    res.status(500).json({ message: "Failed to fetch resume." });
  }
}

// ---- DELETE RESUME ----
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
