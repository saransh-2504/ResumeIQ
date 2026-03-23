import mongoose from "mongoose";

// One application = one user applying to one job
// A user can only apply once per job (enforced by unique index)
const applicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    // Cloudinary public_id of the resume used at time of application
    resumeCloudinaryId: {
      type: String,
      required: true,
    },
    // Original filename shown to recruiter
    resumeFileName: {
      type: String,
      required: true,
    },
    // Status managed by recruiter
    status: {
      type: String,
      enum: ["applied", "reviewed", "shortlisted", "rejected"],
      default: "applied",
    },
  },
  { timestamps: true } // createdAt = appliedAt
);

// Prevent duplicate applications — one user per job
applicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

export default mongoose.model("Application", applicationSchema);
