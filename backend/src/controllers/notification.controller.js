import Notification from "../models/Notification.js";
import Community from "../models/Community.js";
import Message from "../models/Message.js";

// ── GET /api/v1/notifications/unread-count ───────────────────────────────────
// Returns total unread + per-community breakdown
export async function getUnreadCount(req, res) {
  try {
    const userId = req.user._id;

    const records = await Notification.find({ userId })
      .populate("communityId", "name")
      .lean();

    let total = 0;
    const breakdown = [];

    for (const r of records) {
      if (!r.communityId) continue; // community deleted
      total += r.unreadCount;
      if (r.unreadCount > 0) {
        breakdown.push({
          communityId: r.communityId._id,
          communityName: r.communityId.name,
          unreadCount: r.unreadCount,
        });
      }
    }

    res.status(200).json({ total, breakdown });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch unread count." });
  }
}

// ── POST /api/v1/notifications/:communityId/seen ─────────────────────────────
// Resets unread count to 0 and updates lastSeenAt
export async function markSeen(req, res) {
  try {
    const { communityId } = req.params;
    const userId = req.user._id;

    // Verify membership
    const community = await Community.findById(communityId).lean();
    if (!community) return res.status(404).json({ message: "Community not found." });

    const isMember = community.members.some(
      (m) => m.userId.toString() === userId.toString()
    );
    if (!isMember) return res.status(403).json({ message: "Not a member." });

    const notification = await Notification.findOneAndUpdate(
      { userId, communityId },
      { unreadCount: 0, lastSeenAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Marked as seen.", lastSeenAt: notification.lastSeenAt });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark as seen." });
  }
}

// ── GET /api/v1/notifications/:communityId/first-unread ──────────────────────
// Returns the timestamp of the first unread message (for "Jump to first unread")
export async function getFirstUnread(req, res) {
  try {
    const { communityId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ userId, communityId }).lean();
    if (!notification?.lastSeenAt) {
      // Never seen — first message in community
      const first = await Message.findOne({ communityId }).sort({ createdAt: 1 }).lean();
      return res.status(200).json({ firstUnreadAt: first?.createdAt || null });
    }

    const firstUnread = await Message.findOne({
      communityId,
      createdAt: { $gt: notification.lastSeenAt },
    })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json({ firstUnreadAt: firstUnread?.createdAt || null });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch first unread." });
  }
}
