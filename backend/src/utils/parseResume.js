import axios from "axios";
import { createRequire } from "module";
import mammoth from "mammoth";
import Groq from "groq-sdk";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// ---- Download file from Cloudinary signed URL ----
async function downloadFile(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
    maxRedirects: 10,
    headers: {
      "User-Agent": "Mozilla/5.0 ResumeIQ/1.0",
      Accept: "application/pdf,application/octet-stream,*/*",
    },
    validateStatus: (status) => status < 400,
  });
  const buffer = Buffer.from(response.data);
  const contentType = response.headers["content-type"] || "";
  console.log(`📥 Downloaded ${buffer.length} bytes, content-type: ${contentType}`);
  return { buffer, contentType };
}

// ---- Extract raw text from PDF or DOCX ----
async function extractText(buffer, contentType, fileName = "") {
  const name = fileName.toLowerCase();
  const isPdf = contentType.includes("pdf") || name.endsWith(".pdf") ||
    (contentType.includes("octet-stream") && name.endsWith(".pdf"));
  const isDocx = contentType.includes("wordprocessingml") || contentType.includes("msword") ||
    name.endsWith(".docx") || name.endsWith(".doc");

  console.log(`📄 File type — isPdf: ${isPdf}, isDocx: ${isDocx}`);

  if (isPdf) {
    const data = await pdfParse(buffer);
    console.log(`📝 PDF text: ${data.text.length} chars`);
    return data.text;
  }
  if (isDocx) {
    // Also extract hyperlinks from DOCX
    const [rawResult, htmlResult] = await Promise.all([
      mammoth.extractRawText({ buffer }),
      mammoth.convertToHtml({ buffer }),
    ]);
    const hrefMatches = htmlResult.value.match(/href="([^"]+)"/g) || [];
    const hrefs = hrefMatches.map((m) => m.replace(/href="/, "").replace(/"$/, ""));
    let text = rawResult.value;
    if (hrefs.length > 0) text += "\n" + hrefs.join("\n");
    console.log(`📝 DOCX text: ${rawResult.value.length} chars`);
    return text;
  }
  // Fallback
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}

// ---- Regex extractors ----
function extractEmailFromText(text) {
  const cleaned = text.replace(/mailto:/gi, "");
  const match = cleaned.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
}

function extractPhoneFromText(text) {
  const cleaned = text.replace(/tel:/gi, "");
  const match = cleaned.match(/(\+?[\d][\d\s\-().]{8,}[\d])/);
  return match ? match[0].trim() : null;
}

function extractLinksFromText(text) {
  const github = text.match(/github\.com\/[a-zA-Z0-9\-_.]+/i);
  const linkedin = text.match(/linkedin\.com\/in\/[a-zA-Z0-9\-_.]+/i);
  return {
    github: github ? `https://${github[0]}` : null,
    linkedin: linkedin ? `https://${linkedin[0]}` : null,
  };
}

// ---- Sanitize Groq output ----
function sanitizeField(val) {
  if (!val || typeof val !== "string") return null;
  const trimmed = val.trim();
  if (!trimmed) return null;
  const nullPatterns = [
    /^null$/i, /^none$/i, /^n\/a$/i, /^not found/i, /^not available/i,
    /^no email/i, /^no phone/i, /^missing/i, /^unknown/i,
    /^email$/i, /^phone$/i, /^mobile$/i, /^contact$/i, /^name$/i,
    /search carefully/i, /placeholder/i, /^h phone/i, /^phone no/i,
    /^your /i, /^enter /i, /^example/i, /look carefully/i,
    /@ symbol/i, /email here/i, /phone here/i, /^123456/i,
  ];
  if (nullPatterns.some((p) => p.test(trimmed))) return null;
  return trimmed;
}

// ---- Parse with Groq ----
async function parseWithGroq(text, hints = {}) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log(`🔍 Resume preview:\n${text.slice(0, 300)}\n---`);

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: "You are an expert resume parser. Return ONLY valid JSON, no markdown, no explanation.",
      },
      {
        role: "user",
        content: `Parse this resume and return JSON with EXACTLY this structure:
{
  "name": "full name or null",
  "email": "${hints.email || "null"}",
  "phone": "${hints.phone || "null"}",
  "skills": ["skill1", "skill2"],
  "experience": [{"jobTitle":"","organization":"","startDate":"","endDate":"","description":""}],
  "education": [{"institution":"","degree":"","field":"","startDate":"","endDate":""}]
}

If email hint above is not null, use it directly.
If phone hint above is not null, use it directly.

Resume text:
---
${text.slice(0, 6000)}
---`,
      },
    ],
    temperature: 0.0,
    max_tokens: 2048,
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "";
  const cleaned = raw
    .replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();

  const parsed = JSON.parse(cleaned);
  parsed.name = sanitizeField(parsed.name);
  parsed.email = sanitizeField(parsed.email);
  parsed.phone = sanitizeField(parsed.phone);

  console.log(`✅ Parsed — name: ${parsed.name}, email: ${parsed.email}, skills: ${parsed.skills?.length}`);
  return parsed;
}

// ---- MAIN EXPORT ----
export async function parseResumeFromUrl(fileUrl, fileName = "") {
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY not set — skipping parse.");
    return null;
  }

  try {
    console.log(`\n🚀 Starting parse for: ${fileName}`);
    const { buffer, contentType } = await downloadFile(fileUrl);
    const text = await extractText(buffer, contentType, fileName);

    if (!text || text.trim().length < 30) {
      console.warn(`⚠️  Text too short — skipping parse`);
      return null;
    }

    const regexEmail = extractEmailFromText(text);
    const regexPhone = extractPhoneFromText(text);
    const regexLinks = extractLinksFromText(text);
    console.log(`🔎 Regex — email: ${regexEmail}, phone: ${regexPhone}`);

    const parsed = await parseWithGroq(text, { email: regexEmail, phone: regexPhone });

    if (!parsed.email && regexEmail) parsed.email = regexEmail;
    if (!parsed.phone && regexPhone) parsed.phone = regexPhone;
    if (regexLinks.github) parsed.github = regexLinks.github;
    if (regexLinks.linkedin) parsed.linkedin = regexLinks.linkedin;

    console.log(`🎯 Final — name: ${parsed.name}, email: ${parsed.email}, phone: ${parsed.phone}`);
    return parsed;
  } catch (err) {
    console.error(`❌ Parse failed for ${fileName}:`, err.message);
    return null;
  }
}
