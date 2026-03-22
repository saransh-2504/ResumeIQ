import multer from "multer";

// Store file in memory — we'll stream it to S3 directly
const storage = multer.memoryStorage();

// Only allow PDF and DOCX
function fileFilter(req, file, cb) {
  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true); // accept
  } else {
    cb(new Error("Only PDF and DOCX files are allowed."), false); // reject
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});
