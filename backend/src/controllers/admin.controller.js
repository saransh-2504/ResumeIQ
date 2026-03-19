import User from "../models/User.js";
import Job from "../models/Job.js";

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

    if (!user || user.role !== "recruiter") {
      return res.status(404).json({ message: "Recruiter not found." });
    }

    user.isApproved = true;
    await user.save();

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
