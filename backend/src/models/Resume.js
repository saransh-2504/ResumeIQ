import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  // Cloudinary public_id — used to generate signed URLs and delete file
  cloudinaryId: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },

  // ---- Parsed data from Affinda ----
  parsedData: {
    name: String,
    email: String,
    phone: String,
    skills: [String],
    experience: [
      {
        jobTitle: String,
        organization: String,
        startDate: String,
        endDate: String,
        description: String,
      },
    ],
    education: [
      {
        institution: String,
        degree: String,
        field: String,
        startDate: String,
        endDate: String,
      },
    ],
  },

  // ---- Contact verification ----
  // The email/phone that was verified via OTP
  verifiedContact: {
    type: String,
    default: null,
  },
  // Whether the user has completed OTP verification for this resume
  contactVerified: {
    type: Boolean,
    default: false,
  },
});

export default mongoose.model("Resume", resumeSchema);
