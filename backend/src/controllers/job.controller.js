import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import { calculateATS } from "../utils/atsScore.js";

// ---- GET ALL JOBS (public) ----
// Supports filters: type, location, skills (comma-separated)
export async function getJobs(req, res) {
  try {
    const { type, location, skills } = req.query;

    // Build filter object dynamically
    const filter = { isActive: true };

    if (type) filter.type = type;
    if (location) filter.location = new RegExp(location, "i"); // case-insensitive
    if (skills) {
      // skills=React,Node.js → match any job that has at least one of these
      const skillArray = skills.split(",").map((s) => s.trim());
      filter.skillsRequired = { $in: skillArray };
    }

    const jobs = await Job.find(filter)
      .populate("postedBy", "name email recruiterProfile")
      .sort({ createdAt: -1 });

    res.status(200).json({ jobs });
  } catch (err) {
    console.error("Get jobs error:", err.message);
    res.status(500).json({ message: "Failed to fetch jobs." });
  }
}

// ---- GET SINGLE JOB ----
export async function getJobById(req, res) {
  try {
    const job = await Job.findById(req.params.id).populate("postedBy", "name email");

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    res.status(200).json({ job });
  } catch (err) {
    console.error("Get job error:", err.message);
    res.status(500).json({ message: "Failed to fetch job." });
  }
}

// ---- CREATE JOB (recruiter only) ----
export async function createJob(req, res) {
  try {
    const { title, company, location, type, description, skillsRequired } = req.body;

    if (!title || !company || !location || !type || !description) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Block if recruiter hasn't completed company profile setup
    if (!req.user.profileSetupDone) {
      return res.status(403).json({
        message: "Please complete your company profile in Settings before posting jobs.",
        requiresProfileSetup: true,
      });
    }

    const job = await Job.create({
      title,
      company,
      location,
      type,
      description,
      // skillsRequired can be sent as array or comma-separated string
      skillsRequired: Array.isArray(skillsRequired)
        ? skillsRequired
        : skillsRequired?.split(",").map((s) => s.trim()) || [],
      postedBy: req.user._id,
    });

    res.status(201).json({ message: "Job posted successfully.", job });
  } catch (err) {
    console.error("Create job error:", err.message);
    res.status(500).json({ message: "Failed to create job." });
  }
}

// ---- GET RECRUITER'S OWN JOBS ----
export async function getMyJobs(req, res) {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ jobs });
  } catch (err) {
    console.error("Get my jobs error:", err.message);
    res.status(500).json({ message: "Failed to fetch your jobs." });
  }
}

// ---- DELETE JOB (recruiter who posted it) ----
export async function deleteJob(req, res) {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    // Only the recruiter who posted it can delete
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this job." });
    }

    await job.deleteOne();
    res.status(200).json({ message: "Job deleted." });
  } catch (err) {
    console.error("Delete job error:", err.message);
    res.status(500).json({ message: "Failed to delete job." });
  }
}

// ---- EDIT JOB (recruiter who posted it) ----
export async function editJob(req, res) {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) return res.status(404).json({ message: "Job not found." });

    // Only the recruiter who posted it can edit
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this job." });
    }

    const { title, company, location, type, description, skillsRequired } = req.body;

    if (title) job.title = title;
    if (company) job.company = company;
    if (location) job.location = location;
    if (type) job.type = type;
    if (description) job.description = description;
    if (skillsRequired) {
      job.skillsRequired = Array.isArray(skillsRequired)
        ? skillsRequired
        : skillsRequired.split(",").map((s) => s.trim());
    }

    await job.save();
    res.status(200).json({ message: "Job updated successfully.", job });
  } catch (err) {
    console.error("Edit job error:", err.message);
    res.status(500).json({ message: "Failed to update job." });
  }
}

// ---- ADMIN: SUGGEST CHANGES TO A JOB ----
export async function adminSuggestChanges(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });

    const { title, company, location, type, description, skillsRequired } = req.body;

    // Store suggestion with prefixed field names to avoid mongoose reserved keyword conflicts
    job.adminSuggestion = {
      suggestedTitle: title || job.title,
      suggestedCompany: company || job.company,
      suggestedLocation: location || job.location,
      suggestedType: type || job.type,
      suggestedDescription: description || job.description,
      suggestedSkills: skillsRequired
        ? Array.isArray(skillsRequired)
          ? skillsRequired
          : skillsRequired.split(",").map((s) => s.trim())
        : job.skillsRequired,
      status: "pending",
      suggestedAt: new Date(),
    };

    await job.save();
    res.status(200).json({ message: "Suggestion sent to recruiter.", job });
  } catch (err) {
    console.error("Admin suggest error:", err.message);
    res.status(500).json({ message: "Failed to send suggestion." });
  }
}

// ---- RECRUITER: APPROVE ADMIN SUGGESTION ----
export async function approveAdminSuggestion(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    if (!job.adminSuggestion || job.adminSuggestion.status !== "pending") {
      return res.status(400).json({ message: "No pending suggestion found." });
    }

    // Apply the suggested changes
    const s = job.adminSuggestion;
    job.title = s.suggestedTitle;
    job.company = s.suggestedCompany;
    job.location = s.suggestedLocation;
    job.type = s.suggestedType;
    job.description = s.suggestedDescription;
    job.skillsRequired = s.suggestedSkills;
    job.adminSuggestion.status = "approved";

    await job.save();
    res.status(200).json({ message: "Changes approved and applied.", job });
  } catch (err) {
    console.error("Approve suggestion error:", err.message);
    res.status(500).json({ message: "Failed to approve suggestion." });
  }
}

// ---- RECRUITER: REJECT ADMIN SUGGESTION ----
export async function rejectAdminSuggestion(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });

    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    if (!job.adminSuggestion || job.adminSuggestion.status !== "pending") {
      return res.status(400).json({ message: "No pending suggestion found." });
    }

    job.adminSuggestion.status = "rejected";
    await job.save();
    res.status(200).json({ message: "Suggestion rejected." });
  } catch (err) {
    console.error("Reject suggestion error:", err.message);
    res.status(500).json({ message: "Failed to reject suggestion." });
  }
}

// ---- CANDIDATE: GET ATS SCORE FOR A JOB ----
// GET /api/v1/jobs/:id/ats-score
export async function getATSScore(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });

    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: "No resume found. Please upload your resume first." });
    }
    if (!resume.parsedData) {
      return res.status(400).json({ message: "Resume is still being parsed. Please try again in a moment." });
    }

    const ats = calculateATS(resume.parsedData, job);

    res.status(200).json({ ats });
  } catch (err) {
    console.error("ATS score error:", err.message);
    res.status(500).json({ message: "Failed to calculate ATS score." });
  }
}
