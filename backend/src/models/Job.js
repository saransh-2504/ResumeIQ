import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Internship"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    skillsRequired: {
      // Array of skill strings e.g. ["React", "Node.js"]
      type: [String],
      default: [],
    },
    // The recruiter who posted this job
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Admin can suggest edits to a job — stored here until recruiter approves/rejects
    adminSuggestion: {
      // The suggested updated fields
      title: String,
      company: String,
      location: String,
      type: String,
      description: String,
      skillsRequired: [String],
      // Status of the suggestion
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      // When the suggestion was made
      suggestedAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
