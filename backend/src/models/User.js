import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    role: { type: String, enum: ["candidate", "recruiter", "admin"], default: "candidate" },

    // Email verification
    isVerified: { type: Boolean, default: false },
    verificationToken: String,

    // Recruiter approval
    isApproved: { type: Boolean, default: false },

    // OAuth
    oauthProvider: { type: String, enum: ["google", "microsoft", null], default: null },
    oauthId: String,

    // Password reset
    passwordResetToken: String,
    passwordResetExpires: Date,

    // ---- Profile fields (both roles) ----
    phone: { type: String, default: null },
    avatar: { type: String, default: null }, // URL

    // ---- Candidate profile ----
    candidateProfile: {
      headline: String,          // e.g. "Full Stack Developer"
      location: String,
      bio: String,
      skills: [String],
      education: [
        {
          institution: String,
          degree: String,
          field: String,
          startYear: String,
          endYear: String,
        },
      ],
      experience: [
        {
          jobTitle: String,
          company: String,
          startDate: String,
          endDate: String,
          description: String,
        },
      ],
      links: {
        github: String,
        linkedin: String,
        portfolio: String,
      },
    },

    // ---- Recruiter profile ----
    recruiterProfile: {
      companyName: String,
      companyWebsite: String,
      companySize: String,       // e.g. "1-10", "11-50", "51-200", "200+"
      industry: String,
      designation: String,       // e.g. "HR Manager", "CTO"
      companyDescription: String,
      companyLocation: String,
      // Pending change requests — admin must approve
      pendingChanges: {
        companyName: String,
        companyWebsite: String,
        companySize: String,
        industry: String,
        designation: String,
        companyDescription: String,
        companyLocation: String,
        requestedAt: Date,
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      },
    },

    // Email change verification
    pendingEmail: String,
    emailChangeToken: String,
    emailChangeExpires: Date,

    // Profile setup completed (for recruiters after first approval)
    profileSetupDone: { type: Boolean, default: false },

    // Account deletion request (recruiters only — candidates delete directly)
    deleteRequested: { type: Boolean, default: false },
    deleteRequestedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

export default mongoose.model("User", userSchema);
