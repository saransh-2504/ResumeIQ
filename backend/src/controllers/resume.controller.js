import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";
import { env } from "../config/env.js";
import Resume from "../models/Resume.js";

// ---- UPLOAD RESUME ----
export async function uploadResume(req, res) {
  try {
    // Multer puts the file in req.file
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const userId = req.user._id;
    const file = req.file;

    // Build a unique S3 key: resumes/<userId>/<timestamp>-<filename>
    const s3Key = `resumes/${userId}/${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;

    // Check if user already has a resume — if yes, delete old S3 file first
    const existing = await Resume.findOne({ userId });
    if (existing) {
      await s3.send(new DeleteObjectCommand({
        Bucket: env.AWS_S3_BUCKET,
        Key: existing.s3Key,
      }));
    }

    // Upload new file to S3
    await s3.send(new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: file.buffer,       // file is in memory (memoryStorage)
      ContentType: file.mimetype,
    }));

    // Build the public URL
    const fileUrl = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${s3Key}`;

    // Save or update resume record in MongoDB
    const resume = await Resume.findOneAndUpdate(
      { userId },
      {
        userId,
        fileUrl,
        fileName: file.originalname,
        s3Key,
        uploadedAt: new Date(),
      },
      { upsert: true, new: true } // create if not exists, return updated doc
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

    // Delete from S3
    await s3.send(new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: resume.s3Key,
    }));

    // Delete from MongoDB
    await resume.deleteOne();

    res.status(200).json({ message: "Resume deleted." });
  } catch (err) {
    console.error("Delete resume error:", err.message);
    res.status(500).json({ message: "Failed to delete resume." });
  }
}
