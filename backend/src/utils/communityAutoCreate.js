import Community from "../models/Community.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

/**
 * Called after a recruiter saves their company profile.
 * - Extracts domain from recruiter's email
 * - Finds or creates a Community for that domain
 * - Adds recruiter as member (if not already)
 * - Ensures admin is always a member of every community
 */
export async function autoJoinOrCreateCommunity(recruiterId) {
  try {
    const recruiter = await User.findById(recruiterId).select("email recruiterProfile role");
    if (!recruiter || recruiter.role !== "recruiter") return;

    const companyName = recruiter.recruiterProfile?.companyName;
    if (!companyName) return;

    // Extract domain from email e.g. "user@polaris.com" → "polaris.com"
    const domain = recruiter.email.split("@")[1]?.toLowerCase();
    if (!domain) return;

    let community = await Community.findOne({ domain });

    if (!community) {
      // Create new community — use company name as community name
      community = await Community.create({
        name: companyName,
        domain,
        members: [],
      });
    }

    // Add recruiter if not already a member
    const alreadyMember = community.members.some(
      (m) => m.userId.toString() === recruiterId.toString()
    );
    if (!alreadyMember) {
      community.members.push({ userId: recruiterId, role: "recruiter" });
    }

    // Ensure all admins are members of every community
    const admins = await User.find({ role: "admin" }).select("_id");
    for (const admin of admins) {
      const adminAlreadyMember = community.members.some(
        (m) => m.userId.toString() === admin._id.toString()
      );
      if (!adminAlreadyMember) {
        community.members.push({ userId: admin._id, role: "admin" });
        // Create notification record for admin
        await Notification.findOneAndUpdate(
          { userId: admin._id, communityId: community._id },
          { $setOnInsert: { unreadCount: 0, lastSeenAt: null } },
          { upsert: true, new: true }
        );
      }
    }

    await community.save();

    // Create notification record for recruiter
    await Notification.findOneAndUpdate(
      { userId: recruiterId, communityId: community._id },
      { $setOnInsert: { unreadCount: 0, lastSeenAt: null } },
      { upsert: true, new: true }
    );

    return community;
  } catch (err) {
    console.error("Community auto-create error:", err.message);
  }
}

/**
 * When a new admin is created, add them to ALL existing communities.
 */
export async function addAdminToAllCommunities(adminId) {
  try {
    const communities = await Community.find({});
    for (const community of communities) {
      const alreadyMember = community.members.some(
        (m) => m.userId.toString() === adminId.toString()
      );
      if (!alreadyMember) {
        community.members.push({ userId: adminId, role: "admin" });
        await community.save();
        await Notification.findOneAndUpdate(
          { userId: adminId, communityId: community._id },
          { $setOnInsert: { unreadCount: 0, lastSeenAt: null } },
          { upsert: true, new: true }
        );
      }
    }
  } catch (err) {
    console.error("Add admin to communities error:", err.message);
  }
}
