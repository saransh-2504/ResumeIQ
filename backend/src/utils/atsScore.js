// ---- ATS Score Calculator ----
// Compares resume parsed data against job requirements
// Returns a score 0-100 + matched/missing skills + suggestions

// Skill expansion map — if resume has a "bundle" skill, expand it to its components
// e.g. MERN → MongoDB, Express.js, React, Node.js
const SKILL_EXPANSIONS = {
  "mern": ["mongodb", "express", "express.js", "react", "react.js", "node", "node.js"],
  "mean": ["mongodb", "express", "express.js", "angular", "node", "node.js"],
  "mevn": ["mongodb", "express", "express.js", "vue", "vue.js", "node", "node.js"],
  "lamp": ["linux", "apache", "mysql", "php"],
  "full stack": ["html", "css", "javascript", "node", "node.js", "react"],
  "fullstack": ["html", "css", "javascript", "node", "node.js", "react"],
  "data science": ["python", "pandas", "numpy", "machine learning"],
  "devops": ["docker", "kubernetes", "ci/cd", "linux", "git"],
  "android": ["java", "kotlin", "android"],
  "ios": ["swift", "objective-c", "ios"],
};

// Expand resume skills — if a bundle skill is found, add its components too
function expandSkills(skills) {
  const expanded = new Set(skills.map((s) => s.toLowerCase().trim()));
  for (const skill of expanded) {
    const components = SKILL_EXPANSIONS[skill];
    if (components) components.forEach((c) => expanded.add(c));
  }
  return [...expanded];
}

export function calculateATS(parsedData, job) {
  if (!parsedData || !job) return null;

  // Expand resume skills — MERN → MongoDB, Express, React, Node etc.
  const resumeSkills = expandSkills(parsedData.skills || []);
  const jobSkills = (job.skillsRequired || []).map((s) => s.toLowerCase().trim());

  // ---- Skill matching ----
  const matched = jobSkills.filter((s) => resumeSkills.includes(s));
  const missing = jobSkills.filter((s) => !resumeSkills.includes(s));

  // Partial match — e.g. "react" matches "react.js"
  const partialMatched = missing.filter((jobSkill) =>
    resumeSkills.some(
      (rs) => rs.includes(jobSkill) || jobSkill.includes(rs)
    )
  );
  const trulyMissing = missing.filter((s) => !partialMatched.includes(s));

  // ---- Score calculation ----
  // Skills: 60% weight
  const skillScore =
    jobSkills.length === 0
      ? 60
      : Math.round(
          ((matched.length + partialMatched.length * 0.5) / jobSkills.length) * 60
        );  // Experience: 25% weight — check if any experience exists
  const hasExperience = (parsedData.experience || []).length > 0;
  const expScore = hasExperience ? 25 : 0;

  // Education: 15% weight — check if education exists
  const hasEducation = (parsedData.education || []).length > 0;
  const eduScore = hasEducation ? 15 : 0;

  const totalScore = Math.min(100, skillScore + expScore + eduScore);

  // ---- Suggestions ----
  const suggestions = [];
  if (trulyMissing.length > 0) {
    suggestions.push(`Add these missing skills: ${trulyMissing.slice(0, 3).join(", ")}`);
  }
  if (!hasExperience) {
    suggestions.push("Add work experience or internships to your resume.");
  }
  if (!hasEducation) {
    suggestions.push("Add your education details.");
  }
  if (resumeSkills.length < 5) {
    suggestions.push("List more skills — aim for at least 8-10 relevant skills.");
  }
  if (totalScore >= 80) {
    suggestions.push("Strong match! Apply with confidence.");
  } else if (totalScore >= 60) {
    suggestions.push("Good match — address the missing skills to improve your chances.");
  } else {
    suggestions.push("Consider upskilling in the required areas before applying.");
  }

  // Return original casing from job skills list
  const matchedOriginal = job.skillsRequired.filter((s) =>
    resumeSkills.includes(s.toLowerCase().trim()) ||
    resumeSkills.some((rs) => rs.includes(s.toLowerCase().trim()) || s.toLowerCase().trim().includes(rs))
  );
  const missingOriginal = job.skillsRequired.filter((s) =>
    !resumeSkills.includes(s.toLowerCase().trim()) &&
    !resumeSkills.some((rs) => rs.includes(s.toLowerCase().trim()) || s.toLowerCase().trim().includes(rs))
  );

  return {
    score: totalScore,
    matched: matchedOriginal,
    missing: missingOriginal,
    breakdown: { skillScore, expScore, eduScore },
    suggestions,
  };
}
