const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const {
  analyzePreviousPapers,
  getSavedAnalyses,
  deleteAnalysis,
} = require("../controllers/previousPaperController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const uploadDirectory = path.join(__dirname, "../uploads");

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },

  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();

    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      extension;

    cb(null, uniqueName);
  },
});

// =====================================================
// PDF FILE FILTER
// =====================================================

const fileFilter = function (req, file, cb) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (
    file.mimetype === "application/pdf" ||
    extension === ".pdf"
  ) {
    return cb(null, true);
  }

  return cb(new Error(`"${file.originalname}" is not a PDF file.`));
};

// =====================================================
// MULTER CONFIGURATION
// =====================================================

// Supports up to 100 PDF files per request.
// Maximum size of each PDF: 50 MB.
// Total size is still subject to server and AI processing limits.

// Supports up to 30 PDF files per request.
// Maximum size of each PDF: 50 MB.

const upload = multer({
  storage,
  fileFilter,

  limits: {
    files: 30,
    fileSize: 50 * 1024 * 1024,
    fields: 20,
    parts: 60,
  },
});

// =====================================================
// UPLOAD AND ANALYZE PREVIOUS PAPERS
// =====================================================

router.post(
  "/analyze",
  authMiddleware,
  (req, res, next) => {
        upload.array("files", 30)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            success: false,
            message:
              "A PDF exceeds the 50 MB per-file limit. Please upload a smaller PDF.",
          });
        }

        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            success: false,
                        message: "You can upload up to 30 PDFs per request.",
          });
        }

        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "PDF upload failed.",
        });
      }

      next();
    });
  },
  analyzePreviousPapers
);

// =====================================================
// GET SAVED ANALYSES
// =====================================================

router.get("/saved", authMiddleware, getSavedAnalyses);
// =====================================================
// DELETE SAVED ANALYSIS
// =====================================================

router.delete("/:id", authMiddleware, deleteAnalysis);

// =====================================================
// ERROR HANDLER
// =====================================================

router.use((err, req, res, next) => {
  console.error("PREVIOUS PAPER ROUTE ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

  return res.status(500).json({
    success: false,
    message: "An unexpected previous-paper processing error occurred.",
  });
});

// =====================================================
// EXPORT
// =====================================================

module.exports = router;