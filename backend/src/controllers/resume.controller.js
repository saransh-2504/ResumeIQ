import cloudinary from "../config/cloudinary.js";
import Resume from "../models/Resume.js";
import { parseResumeFromUrl } from "../utils/parseResume.js";
import { sendOTP, verifyOTP } from "../utils/otp.js";

// ---- Upload buffer to Cloudinary (private/authenticated) ----
function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "resumeiq/resumes",
        public_id: filename,
        resource_type: "raw",
        overwrite: true,
        type: "authenticated", // private — no public URL
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

// ---- Generate signed URL (15 min expiry) ----
export function generateSignedUrl(cloudinaryId) {
  return cloudinary.utils.private_download_url(cloudinaryId, "", {
    resource_type: "raw",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 15 * 60,
  });
}

// ---- Generate a URL for parser to fetch the file (10 min) ----
function generateParseUrl(cloudinaryId) {
  return cloudinary.utils.private_download_url(cloudinaryId, "", {
    resource_type: "raw",
    type: "authenticated",
    expires_at: Math.floor(Date.now() / 1000) + 10 * 60,
  });
}

// ============================================================
// POST /api/v1/resume — Upload + parse synchronously
// ============================================================
export async function uploadResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const userId = req.user._id;
    const file = req.file;

    // Delete old Cloudinary file if replacing
    const existing = await Resume.findOne({ userId });
    if (existing?.cloudinaryId) {
      await cloudinary.uploader.destroy(existing.cloudinaryId, {
        resource_type: "raw",
        type: "authenticated",
      });
    }

    // Upload to Cloudinary
    const filename = `resume_${userId}_${Date.now()}`;
    const uploadResult = await uploadToCloudinary(file.buffer, filename);

    // Parse synchronously — wait for result before saving
    // This ensures parsedData is always available immediately after upload
    const parseUrl = generateParseUrl(uploadResult.public_id);
    let parsedData = null;
    try {
      parsedData = await parseResumeFromUrl(parseUrl, file.originalname);
    } catch (parseErr) {
      console.warn("Parse failed (non-fatal):", parseErr.message);
    }

    // Save everything in one shot — parsed data included
    const resume = await Resume.findOneAndUpdate(
      { userId },
      {
        userId,
        cloudinaryId: uploadResult.public_id,
        fileName: file.originalname,
        uploadedAt: new Date(),
        contactVerified: false,
        verifiedContact: null,
        parsedData: parsedData || null,
      },
      { upsert: true, new: true }
    );

    res.status(200).json({
      message: "Resume uploaded successfully.",
      resume: {
        fileName: resume.fileName,
        uploadedAt: resume.uploadedAt,
        contactVerified: resume.contactVerified,
        parsedData: resume.parsedData,
      },
    });
  } catch (err) {
    console.error("Resume upload error:", err.message);
    res.status(500).json({ message: "Failed to upload resume." });
  }
}

// ============================================================
// GET /api/v1/resume
// Returns resume info + parsed data + fresh signed URL
// ============================================================
export async function getMyResume(req, res) {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });

    if (!resume) {
      return res.status(404).json({ message: "No resume uploaded yet." });
    }

    const signedUrl = generateSignedUrl(resume.cloudinaryId);

    res.status(200).json({
      resume: {
        fileUrl: signedUrl,
        fileName: resume.fileName,
        uploadedAt: resume.uploadedAt,
        parsedData: resume.parsedData || null,
        contactVerified: resume.contactVerified,
        verifiedContact: resume.verifiedContact,
      },
    });
  } catch (err) {
    console.error("Get resume error:", err.message);
    res.status(500).json({ message: "Failed to fetch resume." });
  }
}

// ============================================================
// DELETE /api/v1/resume
// ============================================================
export async function deleteResume(req, res) {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });

    if (!resume) {
      return res.status(404).json({ message: "No resume found." });
    }

    await cloudinary.uploader.destroy(resume.cloudinaryId, {
      resource_type: "raw",
      type: "authenticated",
    });

    await resume.deleteOne();
    res.status(200).json({ message: "Resume deleted." });
  } catch (err) {
    console.error("Delete resume error:", err.message);
    res.status(500).json({ message: "Failed to delete resume." });
  }
}

// ============================================================
// POST /api/v1/resume/reparse
// Re-triggers parsing for the current resume (useful if parse failed)
// ============================================================
export async function reparseResume(req, res) {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: "No resume found. Please upload first." });
    }

    const parseUrl = generateParseUrl(resume.cloudinaryId);
    let parsedData = null;
    try {
      parsedData = await parseResumeFromUrl(parseUrl, resume.fileName);
    } catch (parseErr) {
      console.warn("Re-parse failed:", parseErr.message);
    }

    if (!parsedData) {
      return res.status(500).json({ message: "Could not parse resume. Please try re-uploading." });
    }

    resume.parsedData = parsedData;
    await resume.save();

    res.status(200).json({
      message: "Resume re-parsed successfully.",
      parsedData,
    });
  } catch (err) {
    console.error("Reparse error:", err.message);
    res.status(500).json({ message: "Failed to re-parse resume." });
  }
}

// ============================================================
// POST /api/v1/resume/send-otp
// Auto-matches resume email with logged-in user email
// If they match → send OTP automatically
// If they don't match → return error (no manual input allowed)
// ============================================================
export async function sendContactOTP(req, res) {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: "No resume found. Please upload first." });
    }

    // Parsing still in progress
    if (!resume.parsedData) {
      return res.status(400).json({ message: "Resume is still being parsed. Please wait a moment and try again." });
    }

    const parsedEmail = resume.parsedData.email?.toLowerCase().trim();
    const accountEmail = req.user.email?.toLowerCase().trim();

    // No email found in resume
    if (!parsedEmail) {
      return res.status(400).json({
        message: "No email found in your resume. Please add your email to your resume and re-upload.",
        noEmailInResume: true,
      });
    }

    // Emails don't match — block it
    if (parsedEmail !== accountEmail) {
      return res.status(400).json({
        message: `Email in your resume (${parsedEmail}) does not match your account email (${accountEmail}). Please update your resume with the correct email.`,
        emailMismatch: true,
        parsedEmail,
        accountEmail,
      });
    }

    // Emails match — send OTP automatically to account email
    await sendOTP(accountEmail, req.user.name);

    res.status(200).json({
      message: `OTP sent to ${accountEmail}. Valid for 5 minutes.`,
      contact: accountEmail,
    });
  } catch (err) {
    res.status(429).json({ message: err.message });
  }
}

// ============================================================
// POST /api/v1/resume/verify-otp
// Body: { otp } — contact is taken from logged-in user's email (no manual input)
// ============================================================
export async function verifyContactOTP(req, res) {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required." });
    }

    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ message: "No resume found." });
    }

    // Always verify against the logged-in user's account email
    const contact = req.user.email;

    await verifyOTP(contact, otp);

    resume.contactVerified = true;
    resume.verifiedContact = contact;
    await resume.save();

    res.status(200).json({
      message: "Contact verified successfully.",
      contactVerified: true,
      verifiedContact: contact,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// ============================================================
// GET /api/v1/resume/analysis
// Returns a detailed resume health report — no job comparison needed
// ============================================================
export async function getResumeAnalysis(req, res) {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) return res.status(404).json({ message: "No resume found." });
    if (!resume.parsedData) return res.status(400).json({ message: "Resume not parsed yet." });

    const p = resume.parsedData;
    const skills = p.skills || [];
    const experience = p.experience || [];
    const education = p.education || [];

    // ---- Completeness score ----
    // Each section contributes to overall profile completeness
    const sections = {
      name:       { present: !!p.name,            weight: 10, label: "Name" },
      email:      { present: !!p.email,           weight: 15, label: "Email" },
      phone:      { present: !!p.phone,           weight: 10, label: "Phone" },
      skills:     { present: skills.length >= 5,  weight: 25, label: "Skills (5+)" },
      experience: { present: experience.length > 0, weight: 25, label: "Work Experience" },
      education:  { present: education.length > 0,  weight: 15, label: "Education" },
    };

    const completenessScore = Object.values(sections).reduce(
      (sum, s) => sum + (s.present ? s.weight : 0), 0
    );

    // ---- Skill categorization ----
    const techCategories = {
      "Frontend":   ["react","react.js","next.js","vue","vue.js","angular","html","css","tailwind","bootstrap","javascript","typescript","sass"],
      "Backend":    ["node","node.js","express","express.js","python","django","flask","fastapi","java","spring","php","laravel","ruby","go","rust","c#",".net"],
      "Database":   ["mongodb","mysql","postgresql","redis","firebase","sql","sqlite","oracle","dynamodb"],
      "DevOps":     ["docker","kubernetes","aws","azure","gcp","ci/cd","jenkins","terraform","ansible","linux","git","github"],
      "Mobile":     ["react native","flutter","android","ios","swift","kotlin"],
      "AI/ML":      ["machine learning","deep learning","tensorflow","pytorch","nlp","pandas","numpy","scikit-learn","data science"],
      "Other":      [],
    };

    const skillsLower = skills.map((s) => s.toLowerCase());
    const categorized = {};
    const categorizedSkills = new Set();

    for (const [cat, keywords] of Object.entries(techCategories)) {
      if (cat === "Other") continue;
      const matched = skills.filter((s) =>
        keywords.some((k) => s.toLowerCase().includes(k) || k.includes(s.toLowerCase()))
      );
      if (matched.length > 0) {
        categorized[cat] = matched;
        matched.forEach((s) => categorizedSkills.add(s));
      }
    }
    // Remaining skills go to Other
    const otherSkills = skills.filter((s) => !categorizedSkills.has(s));
    if (otherSkills.length > 0) categorized["Other"] = otherSkills;

    // ---- Experience analysis ----
    const totalExpYears = experience.reduce((sum, exp) => {
      // Try to parse years from dates
      const start = parseInt(exp.startDate);
      const end = exp.endDate?.toLowerCase().includes("present")
        ? new Date().getFullYear()
        : parseInt(exp.endDate);
      if (start && end && end >= start) return sum + (end - start);
      return sum + 1; // default 1 year if can't parse
    }, 0);

    // ---- Suggestions ----
    const suggestions = [];
    if (!p.email) suggestions.push({ type: "error", text: "Add your email address — recruiters need it to contact you." });
    if (!p.phone) suggestions.push({ type: "warning", text: "Add a phone number for faster recruiter outreach." });
    if (skills.length < 5) suggestions.push({ type: "warning", text: `You have ${skills.length} skill(s) listed. Aim for at least 8-10 relevant skills.` });
    if (skills.length >= 5 && skills.length < 8) suggestions.push({ type: "info", text: "Good start on skills — adding a few more will improve your match rate." });
    if (experience.length === 0) suggestions.push({ type: "warning", text: "No work experience found. Add internships, projects, or freelance work." });
    if (education.length === 0) suggestions.push({ type: "warning", text: "Add your education details — degree, institution, and year." });
    if (experience.length > 0 && !experience[0].description) suggestions.push({ type: "info", text: "Add descriptions to your work experience — explain your impact and achievements." });
    if (completenessScore >= 90) suggestions.push({ type: "success", text: "Excellent profile! Your resume is well-structured." });
    else if (completenessScore >= 70) suggestions.push({ type: "info", text: "Good profile. Fill in the missing sections to maximize your chances." });

    res.status(200).json({
      analysis: {
        completenessScore,
        sections,
        skills: {
          total: skills.length,
          categorized,
          all: skills,
        },
        experience: {
          count: experience.length,
          totalYears: totalExpYears,
          items: experience,
        },
        education: {
          count: education.length,
          items: education,
        },
        contact: {
          name: p.name,
          email: p.email,
          phone: p.phone,
          github: p.github || null,
          linkedin: p.linkedin || null,
        },
        suggestions,
      },
    });
  } catch (err) {
    console.error("Resume analysis error:", err.message);
    res.status(500).json({ message: "Failed to analyze resume." });
  }
}
