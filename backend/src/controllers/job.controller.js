import Job from "../models/Job.js";

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
      .populate("postedBy", "name email") // show recruiter name
      .sort({ createdAt: -1 }); // newest first

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
