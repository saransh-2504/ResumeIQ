import Application from "../models/Application.js";
import Resume from "../models/Resume.js";
import Job from "../models/Job.js";
import cloudinary from "../config/cloudinary.js";

// Generate a signed URL for a resume (15 min expiry)
function generateSignedUrl(cloudinaryId) {
  return cloudinary.utils.private_download_url(cloudinaryId, "", {
    resource_type: "raw",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 15 * 60,
  });
}

// ---- APPLY TO A JOB ----
// POST /api/v1/jobs/:id/apply
// Uses the resume already stored in DB — no re-upload needed
export async function applyToJob(req, res) {
  try {
    const jobId = req.params.id;
    const userId = req.user._id;

    // Check job exists and is active
    const job = await Job.findById(jobId);
    if (!job || !job.isActive) {
      return res.status(404).json({ message: "Job not found or no longer active." });
    }

    // Check user has a resume on file
    const resume = await Resume.findOne({ userId });
    if (!resume) {
      return res.status(400).json({
        message: "No resume found. Please upload your resume before applying.",
      });
    }

    // Require contact verification before applying
    if (!resume.contactVerified) {
      return res.status(403).json({
        message: "Please verify your contact information before applying.",
        requiresVerification: true,
      });
    }

    // Check if already applied
    const existing = await Application.findOne({ userId, jobId });
    if (existing) {
      return res.status(409).json({ message: "You have already applied to this job." });
    }

    // Create application — attach resume snapshot
    const application = await Application.create({
      userId,
      jobId,
      resumeCloudinaryId: resume.cloudinaryId,
      resumeFileName: resume.fileName,
    });

    res.status(201).json({
      message: "Application submitted successfully.",
      application: {
        _id: application._id,
        jobId: application.jobId,
        status: application.status,
        appliedAt: application.createdAt,
        resumeFileName: application.resumeFileName,
      },
    });
  } catch (err) {
    // Duplicate key error from MongoDB unique index
    if (err.code === 11000) {
      return res.status(409).json({ message: "You have already applied to this job." });
    }
    console.error("Apply error:", err.message);
    res.status(500).json({ message: "Failed to submit application." });
  }
}

// ---- GET MY APPLICATIONS (candidate) ----
// GET /api/v1/applications/my
export async function getMyApplications(req, res) {
  try {
    const applications = await Application.find({ userId: req.user._id })
      .populate("jobId", "title company location type isActive")
      .sort({ createdAt: -1 });

    res.status(200).json({ applications });
  } catch (err) {
    console.error("Get my applications error:", err.message);
    res.status(500).json({ message: "Failed to fetch applications." });
  }
}

// ---- GET APPLICANTS FOR A JOB (recruiter) ----
// GET /api/v1/jobs/:id/applications
export async function getJobApplicants(req, res) {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found." });

    // Only the recruiter who posted the job can see applicants
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    const applications = await Application.find({ jobId: req.params.id })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    // Generate fresh signed resume URLs for each applicant
    const result = applications.map((app) => ({
      _id: app._id,
      status: app.status,
      appliedAt: app.createdAt,
      resumeFileName: app.resumeFileName,
      resumeUrl: generateSignedUrl(app.resumeCloudinaryId),
      candidate: {
        name: app.userId?.name,
        email: app.userId?.email,
      },
    }));

    res.status(200).json({ applicants: result });
  } catch (err) {
    console.error("Get applicants error:", err.message);
    res.status(500).json({ message: "Failed to fetch applicants." });
  }
}

// ---- GET FRESH RESUME URL (recruiter/admin) ----
// GET /api/v1/applications/:id/resume-url
export async function getResumeUrl(req, res) {
  try {
    const application = await Application.findById(req.params.id).populate("jobId");
    if (!application) return res.status(404).json({ message: "Application not found." });

    // Recruiter must own the job
    if (
      req.user.role === "recruiter" &&
      application.jobId.postedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized." });
    }

    const url = generateSignedUrl(application.resumeCloudinaryId);
    res.status(200).json({ url, fileName: application.resumeFileName });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate resume URL." });
  }
}

// ---- STREAM RESUME (recruiter/admin) — proxies Cloudinary file inline ----
// GET /api/v1/applications/:id/resume-view
export async function streamResume(req, res) {
  try {
    const application = await Application.findById(req.params.id).populate("jobId");
    if (!application) return res.status(404).json({ message: "Application not found." });

    if (
      req.user.role === "recruiter" &&
      application.jobId.postedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized." });
    }

    const signedUrl = generateSignedUrl(application.resumeCloudinaryId);

    // Fetch from Cloudinary and stream to client with inline headers
    const axios = (await import("axios")).default;
    const response = await axios.get(signedUrl, { responseType: "stream" });

    const fileName = application.resumeFileName || "resume";
    const isPdf = fileName.toLowerCase().endsWith(".pdf");

    res.setHeader("Content-Type", isPdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    response.data.pipe(res);
  } catch (err) {
    console.error("Stream resume error:", err.message);
    res.status(500).json({ message: "Failed to stream resume." });
  }
}
// PATCH /api/v1/applications/:id/status
export async function updateApplicationStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ["applied", "reviewed", "shortlisted", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const application = await Application.findById(req.params.id).populate("jobId");
    if (!application) return res.status(404).json({ message: "Application not found." });

    // Only the recruiter who owns the job can update status
    if (application.jobId.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized." });
    }

    application.status = status;
    await application.save();

    res.status(200).json({ message: "Status updated.", status: application.status });
  } catch (err) {
    console.error("Update status error:", err.message);
    res.status(500).json({ message: "Failed to update status." });
  }
}
