import Community from "../models/Community.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Application from "../models/Application.js";
import User from "../models/User.js";

// ── GET /api/v1/community/:id ─────────────────────────────────────────────────
export async function getCommunityById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(id).lean();
    if (!community) return res.status(404).json({ message: "Community not found." });
    if (!isMember(community, userId))
      return res.status(403).json({ message: "Not a member of this community." });

    res.status(200).json({
      community: {
        _id: community._id,
        name: community.name,
        domain: community.domain,
        memberCount: community.members.length,
        createdAt: community.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch community." });
  }
}

// ── GET /api/v1/community/:id/members ────────────────────────────────────────
export async function getCommunityMembers(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const community = await Community.findById(id)
      .populate("members.userId", "name email role avatar")
      .lean();
    if (!community) return res.status(404).json({ message: "Community not found." });
    if (!isMember(community, userId))
      return res.status(403).json({ message: "Not a member of this community." });

    res.status(200).json({ members: community.members });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch members." });
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function isMember(community, userId) {
  return community.members.some((m) => m.userId.toString() === userId.toString());
}

async function bumpUnread(communityId, excludeUserId) {
  // Increment unreadCount for every member except the sender
  await Notification.updateMany(
    { communityId, userId: { $ne: excludeUserId } },
    { $inc: { unreadCount: 1 } }
  );
}

// ── GET /api/v1/community/discover ───────────────────────────────────────────
// Returns: { joined: [...], suggested: [...] }
export async function discoverCommunities(req, res) {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    const allCommunities = await Community.find({}).lean();

    const joined = [];
    const suggested = [];

    // Collect skills/companies from candidate's applications for suggestions
    let candidateCompanies = [];
    let candidateSkills = [];
    if (role === "candidate") {
      const applications = await Application.find({ userId })
        .populate("jobId", "company skillsRequired")
        .lean();
      candidateCompanies = applications.map((a) => a.jobId?.company?.toLowerCase()).filter(Boolean);
      candidateSkills = [...new Set(applications.flatMap((a) => a.jobId?.skillsRequired || []))];
    }

    for (const c of allCommunities) {
      const memberEntry = c.members.find((m) => m.userId.toString() === userId.toString());
      if (memberEntry) {
        joined.push({ _id: c._id, name: c.name, domain: c.domain, memberCount: c.members.length });
      } else {
        // Suggest based on applied companies (partial match) or skills
        const nameLower = c.name.toLowerCase();
        const isRelevant =
          candidateCompanies.some((co) => nameLower.includes(co) || co.includes(nameLower)) ||
          candidateSkills.some((sk) => nameLower.includes(sk.toLowerCase()));

        if (isRelevant || role === "admin") {
          suggested.push({ _id: c._id, name: c.name, domain: c.domain, memberCount: c.members.length });
        }
      }
    }

    res.status(200).json({ joined, suggested });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch communities." });
  }
}

// ── POST /api/v1/community/:id/join ──────────────────────────────────────────
export async function joinCommunity(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const role = req.user.role;

    const community = await Community.findById(id);
    if (!community) return res.status(404).json({ message: "Community not found." });

    if (isMember(community, userId))
      return res.status(400).json({ message: "Already a member." });

    community.members.push({ userId, role });
    await community.save();

    await Notification.findOneAndUpdate(
      { userId, communityId: community._id },
      { $setOnInsert: { unreadCount: 0, lastSeenAt: null } },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Joined community.", communityId: community._id });
  } catch (err) {
    res.status(500).json({ message: "Failed to join community." });
  }
}

// ── GET /api/v1/community/:id/messages ───────────────────────────────────────
// Supports ?before=<ts>&limit=30  (pagination — older messages)
// Supports ?after=<ts>            (polling — new messages only)
export async function getMessages(req, res) {
  try {
    const { id } = req.params;
    const { before, after, limit = 30 } = req.query;
    const userId = req.user._id;

    const community = await Community.findById(id).lean();
    if (!community) return res.status(404).json({ message: "Community not found." });
    if (!isMember(community, userId))
      return res.status(403).json({ message: "Not a member of this community." });

    let query = { communityId: id };

    if (after) {
      // Polling: messages newer than timestamp
      query.createdAt = { $gt: new Date(after) };
      const messages = await Message.find(query)
        .sort({ createdAt: 1 })
        .populate("senderId", "name role avatar")
        .lean();
      return res.status(200).json({ messages });
    }

    // Cursor-based pagination: messages older than `before`, latest first
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate("senderId", "name role avatar")
      .lean();

    // Return in chronological order
    messages.reverse();

    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages." });
  }
}

// ── POST /api/v1/community/:id/messages ──────────────────────────────────────
export async function sendMessage(req, res) {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;
    const role = req.user.role;

    if (!text?.trim()) return res.status(400).json({ message: "Message text is required." });
    if (text.trim().length > 2000)
      return res.status(400).json({ message: "Message exceeds 2000 character limit." });

    const community = await Community.findById(id).lean();
    if (!community) return res.status(404).json({ message: "Community not found." });
    if (!isMember(community, userId))
      return res.status(403).json({ message: "Not a member of this community." });

    // Permission: candidates cannot send messages
    if (role === "candidate")
      return res.status(403).json({ message: "Candidates cannot send messages." });

    // Recruiters can only send in their own community (matched by domain)
    if (role === "recruiter") {
      const recruiter = await User.findById(userId).select("email").lean();
      const domain = recruiter.email.split("@")[1]?.toLowerCase();
      if (community.domain !== domain)
        return res.status(403).json({ message: "Recruiters can only message in their own company community." });
    }

    const message = await Message.create({
      communityId: id,
      senderId: userId,
      text: text.trim(),
    });

    // Bump unread counts for all other members
    await bumpUnread(id, userId);

    const populated = await message.populate("senderId", "name role avatar");
    res.status(201).json({ message: populated });
  } catch (err) {
    res.status(500).json({ message: "Failed to send message." });
  }
}

// ── POST /api/v1/community/:id/messages/:msgId/react ─────────────────────────
export async function reactToMessage(req, res) {
  try {
    const { id, msgId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) return res.status(400).json({ message: "Emoji is required." });

    const community = await Community.findById(id).lean();
    if (!community) return res.status(404).json({ message: "Community not found." });
    if (!isMember(community, userId))
      return res.status(403).json({ message: "Not a member of this community." });

    const message = await Message.findOne({ _id: msgId, communityId: id });
    if (!message) return res.status(404).json({ message: "Message not found." });

    const existingIdx = message.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingIdx !== -1) {
      // Toggle off — remove reaction
      message.reactions.splice(existingIdx, 1);
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();
    res.status(200).json({ reactions: message.reactions });
  } catch (err) {
    res.status(500).json({ message: "Failed to react to message." });
  }
}
