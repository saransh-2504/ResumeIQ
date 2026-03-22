import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    // One resume per user — userId is unique
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Full S3 URL to the file
    fileUrl: {
      type: String,
      required: true,
    },
    // Original filename the user uploaded
    fileName: {
      type: String,
      required: true,
    },
    // S3 key — needed to delete old file when user re-uploads
    s3Key: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

export default mongoose.model("Resume", resumeSchema);
