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
  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
