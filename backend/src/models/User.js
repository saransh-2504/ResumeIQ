import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // not required because OAuth users won't have a password
    },
    role: {
      type: String,
      enum: ["candidate", "recruiter", "admin"],
      default: "candidate",
    },

    // Email verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,

    // Recruiter-specific: admin must approve before they can post jobs
    isApproved: {
      type: Boolean,
      default: false,
    },

    // OAuth provider info (google / microsoft)
    oauthProvider: {
      type: String,
      enum: ["google", "microsoft", null],
      default: null,
    },
    oauthId: String,
  },
  { timestamps: true }
);

// Hash password before saving (only if it was changed)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare plain password with hashed one
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

export default mongoose.model("User", userSchema);
