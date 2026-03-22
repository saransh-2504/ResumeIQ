import cloudinary from "../config/cloudinary.js";
import Resume from "../models/Resume.js";

// Helper — upload buffer to Cloudinary
function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    // Use upload_stream to send buffer directly (no temp file needed)
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "resumeiq/resumes",   // stored in this folder on Cloudinary
        public_id: filename,          // file name without extension
        resource_type: "raw",         // "raw" = non-image files like PDF/DOCX
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer); // send the file buffer
  });
}

// ---- UPLOAD RESUME ----
export async function uploadResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const userId = req.user._id;
    const file = req.file;

    // Check if user already has a resume — delete old one from Cloudinary first
    const existing = await Resume.findOne({ userId });
    if (existing?.cloudinaryId) {
      await cloudinary.uploader.destroy(existing.cloudinaryId, { resource_type: "raw" });
    }

    // Build a unique filename: userId_timestamp
    const filename = `resume_${userId}_${Date.now()}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file.buffer, filename);

    // Save/update resume record in MongoDB — only store URL, not the file
    const resume = await Resume.findOneAndUpdate(
      { userId },
      {
        userId,
        fileUrl: result.secure_url,       // HTTPS URL to the file
        fileName: file.originalname,       // original name user uploaded
        cloudinaryId: result.public_id,    // needed to delete later
        uploadedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "Resume uploaded successfully.",
      resume: {
        fileUrl: resume.fileUrl,
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
export async function getMyResume(req, res) {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });

    if (!resume) {
      return res.status(404).json({ message: "No resume uploaded yet." });
    }

    res.status(200).json({
      resume: {
        fileUrl: resume.fileUrl,
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

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(resume.cloudinaryId, { resource_type: "raw" });

    // Delete from MongoDB
    await resume.deleteOne();

    res.status(200).json({ message: "Resume deleted." });
  } catch (err) {
    console.error("Delete resume error:", err.message);
    res.status(500).json({ message: "Failed to delete resume." });
  }
}
