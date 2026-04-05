import mongoose from "mongoose";

// Permanent — never expires. Tracks unread message counts per user per community.
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
    unreadCount: { type: Number, default: 0 },
    lastSeenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1 });
notificationSchema.index({ userId: 1, communityId: 1 }, { unique: true });

export default mongoose.model("Notification", notificationSchema);
