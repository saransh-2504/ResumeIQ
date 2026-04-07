import User from "../models/User.js";
import Job from "../models/Job.js";
import { sendRecruiterApprovalEmail } from "../utils/sendEmail.js";
import { env } from "../config/env.js";
import { autoJoinOrCreateCommunity } from "../utils/communityAutoCreate.js";

// ---- GET ALL PENDING RECRUITERS ----
export async function getPendingRecruiters(req, res) {
  try {
    const recruiters = await User.find({
      role: "recruiter",
      isApproved: false,
    }).select("-password");

    res.status(200).json({ recruiters });
  } catch (err) {
    console.error("Get pending recruiters error:", err.message);
    res.status(500).json({ message: "Failed to fetch recruiters." });
  }
}

// ---- GET ALL RECRUITERS ----
export async function getAllRecruiters(req, res) {
  try {
    const recruiters = await User.find({ role: "recruiter" }).select("-password");
    res.status(200).json({ recruiters });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch recruiters." });
  }
}

// ---- APPROVE RECRUITER ----
export async function approveRecruiter(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "recruiter") return res.status(404).json({ message: "Recruiter not found." });

    user.isApproved = true;
    await user.save();

    // If recruiter already has company profile set, trigger community join/create
    if (user.recruiterProfile?.companyName) {
      autoJoinOrCreateCommunity(user._id).catch((e) =>
        console.error("Community hook on approval failed:", e.message)
      );
    }

    // Send approval email
    try {
      await sendRecruiterApprovalEmail(user.email, user.name, `${env.CLIENT_URL}/recruiter`);
    } catch (emailErr) {
      console.error("Approval email failed:", emailErr.message);
    }

    res.status(200).json({ message: `${user.name} has been approved.` });
  } catch (err) {
    console.error("Approve recruiter error:", err.message);
    res.status(500).json({ message: "Failed to approve recruiter." });
  }
}

// ---- REJECT / DELETE RECRUITER ----
export async function rejectRecruiter(req, res) {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.role !== "recruiter") {
      return res.status(404).json({ message: "Recruiter not found." });
    }

    await user.deleteOne();
    res.status(200).json({ message: "Recruiter rejected and removed." });
  } catch (err) {
    console.error("Reject recruiter error:", err.message);
    res.status(500).json({ message: "Failed to reject recruiter." });
  }
}

// ---- GET ALL USERS ----
export async function getAllUsers(req, res) {
  try {
    const users = await User.find({ role: "candidate" }).select("-password");
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users." });
  }
}

// ---- GET ALL JOBS ----
export async function getAllJobs(req, res) {
  try {
    const jobs = await Job.find().populate("postedBy", "name email");
    res.status(200).json({ jobs });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch jobs." });
  }
}

// ---- GET RECRUITERS WITH PENDING PROFILE CHANGES ----
export async function getPendingProfileChanges(req, res) {
  try {
    const recruiters = await User.find({
      role: "recruiter",
      "recruiterProfile.pendingChanges.status": "pending",
    }).select("-password");
    res.status(200).json({ recruiters });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pending changes." });
  }
}

// ---- APPROVE RECRUITER PROFILE CHANGE ----
export async function approveProfileChange(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "recruiter") return res.status(404).json({ message: "Recruiter not found." });

    const changes = user.recruiterProfile.pendingChanges;
    if (!changes || changes.status !== "pending") return res.status(400).json({ message: "No pending changes." });

    // Apply changes
    user.recruiterProfile.companyName = changes.companyName;
    user.recruiterProfile.companyWebsite = changes.companyWebsite;
    user.recruiterProfile.companySize = changes.companySize;
    user.recruiterProfile.industry = changes.industry;
    user.recruiterProfile.designation = changes.designation;
    user.recruiterProfile.companyDescription = changes.companyDescription;
    user.recruiterProfile.companyLocation = changes.companyLocation;
    user.recruiterProfile.pendingChanges.status = "approved";
    await user.save();

    res.status(200).json({ message: "Profile changes approved." });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve changes." });
  }
}

// ---- REJECT RECRUITER PROFILE CHANGE ----
export async function rejectProfileChange(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "recruiter") return res.status(404).json({ message: "Recruiter not found." });

    user.recruiterProfile.pendingChanges.status = "rejected";
    await user.save();

    res.status(200).json({ message: "Profile changes rejected." });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject changes." });
  }
}

// ---- GET RECRUITERS WITH PENDING DELETE REQUESTS ----
export async function getPendingDeleteRequests(req, res) {
  try {
    const recruiters = await User.find({ role: "recruiter", deleteRequested: true }).select("-password");
    res.status(200).json({ recruiters });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch delete requests." });
  }
}

// ---- APPROVE RECRUITER ACCOUNT DELETION ----
export async function approveAccountDeletion(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== "recruiter") return res.status(404).json({ message: "Recruiter not found." });

    // Cleanup resume from Cloudinary if exists
    try {
      const Resume = (await import("../models/Resume.js")).default;
      const cloudinary = (await import("../config/cloudinary.js")).default;
      const resume = await Resume.findOne({ userId: user._id });
      if (resume?.cloudinaryId) {
        await cloudinary.uploader.destroy(resume.cloudinaryId, { resource_type: "raw", type: "authenticated" });
        await resume.deleteOne();
      }
    } catch (e) { console.warn("Resume cleanup failed:", e.message); }

    await user.deleteOne();
    res.status(200).json({ message: "Recruiter account deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete account." });
  }
}

// ---- REJECT RECRUITER ACCOUNT DELETION ----
export async function rejectAccountDeletion(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Recruiter not found." });
    user.deleteRequested = false;
    user.deleteRequestedAt = null;
    await user.save();
    res.status(200).json({ message: "Deletion request rejected." });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject request." });
  }
}
