import mongoose from "mongoose";

const memberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "recruiter", "candidate"], required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    members: [memberSchema],
  },
  { timestamps: true }
);

// Index for fast member lookup
communitySchema.index({ "members.userId": 1 });

export default mongoose.model("Community", communitySchema);
