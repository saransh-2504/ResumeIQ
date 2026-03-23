import axios from "axios";
import { createRequire } from "module";
import mammoth from "mammoth";
import Groq from "groq-sdk";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// ---- Download file from Cloudinary signed URL ----
async function downloadFile(url) {
  // Cloudinary authenticated URLs redirect — follow them
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
    maxRedirects: 10,
    headers: {
      "User-Agent": "Mozilla/5.0 ResumeIQ/1.0",
      Accept: "application/pdf,application/octet-stream,*/*",
    },
    // Don't throw on 3xx — let axios follow
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
  const isPdf =
    contentType.includes("pdf") ||
    name.endsWith(".pdf") ||
    // Cloudinary raw files sometimes return octet-stream
    (contentType.includes("octet-stream") && name.endsWith(".pdf"));

  const isDocx =
    contentType.includes("wordprocessingml") ||
    contentType.includes("msword") ||
    name.endsWith(".docx") ||
    name.endsWith(".doc");

  console.log(`📄 File type detection — isPdf: ${isPdf}, isDocx: ${isDocx}, fileName: ${fileName}`);

  if (isPdf) {
    const data = await pdfParse(buffer);
    console.log(`📝 PDF text extracted: ${data.text.length} chars`);
    return data.text;
  }

  if (isDocx) {
    const result = await mammoth.extractRawText({ buffer });
    console.log(`📝 DOCX text extracted: ${result.value.length} chars`);
    return result.value;
  }

  // Fallback — try PDF first (most common), then DOCX
  console.log("⚠️  Unknown type — trying PDF fallback");
  try {
    const data = await pdfParse(buffer);
    console.log(`📝 Fallback PDF text: ${data.text.length} chars`);
    return data.text;
  } catch {
    const result = await mammoth.extractRawText({ buffer });
    console.log(`📝 Fallback DOCX text: ${result.value.length} chars`);
    return result.value;
  }
}

// ---- Regex fallback: extract email directly from text ----
function extractEmailFromText(text) {
  const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
}

// ---- Regex fallback: extract phone directly from text ----
function extractPhoneFromText(text) {
  // Matches common formats: +91-XXXXXXXXXX, (123) 456-7890, 1234567890, etc.
  const match = text.match(/(\+?\d[\d\s\-().]{8,}\d)/);
  return match ? match[0].trim() : null;
}

// ---- Parse text with Groq Llama ----
async function parseWithGroq(text) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Show first 300 chars of extracted text for debugging
  console.log(`🔍 Resume text preview:\n${text.slice(0, 300)}\n---`);

  // Pre-extract email via regex as a safety net
  const regexEmail = extractEmailFromText(text);
  const regexPhone = extractPhoneFromText(text);
  console.log(`🔎 Regex pre-extract — email: ${regexEmail}, phone: ${regexPhone}`);

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "You are an expert resume parser. Extract ALL information accurately. Return ONLY a valid JSON object — no markdown, no explanation, no extra text.",
      },
      {
        role: "user",
        content: `Parse this resume and return JSON with EXACTLY this structure (no extra fields):
{
  "name": "full name or null",
  "email": "email@example.com or null",
  "phone": "phone number or null",
  "skills": ["skill1", "skill2"],
  "experience": [{"jobTitle":"","organization":"","startDate":"","endDate":"","description":""}],
  "education": [{"institution":"","degree":"","field":"","startDate":"","endDate":""}]
}

The email in this resume is likely: ${regexEmail || "not found by regex — search carefully"}
Look for any text containing @ symbol.

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
  console.log(`🤖 Groq raw response (first 300): ${raw.slice(0, 300)}`);

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  // Safety net: if Groq missed the email/phone, use regex result
  if (!parsed.email && regexEmail) {
    console.log(`⚠️  Groq missed email — using regex fallback: ${regexEmail}`);
    parsed.email = regexEmail;
  }
  if (!parsed.phone && regexPhone) {
    console.log(`⚠️  Groq missed phone — using regex fallback: ${regexPhone}`);
    parsed.phone = regexPhone;
  }

  console.log(`✅ Final parsed — name: ${parsed.name}, email: ${parsed.email}, skills: ${parsed.skills?.length}`);
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
      console.warn(`⚠️  Text too short (${text?.length} chars) — skipping parse`);
      return null;
    }

    const parsed = await parseWithGroq(text);
    return parsed;
  } catch (err) {
    console.error(`❌ Parse failed for ${fileName}:`, err.message);
    return null;
  }
}
