import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 2000, trim: true },
    reactions: [reactionSchema],
  },
  { timestamps: true }
);

// Indexes for efficient polling and pagination
messageSchema.index({ communityId: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
