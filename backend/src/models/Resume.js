import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    // One resume per user
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Cloudinary HTTPS URL — this is what we store and show
    fileUrl: {
      type: String,
      required: true,
    },
    // Original filename the user uploaded
    fileName: {
      type: String,
      required: true,
    },
    // Cloudinary public_id — needed to delete the file later
    cloudinaryId: {
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
