const express = require("express");
const multer = require("multer");
const path = require("path");

const {
  analyzePreviousPapers,
  getSavedAnalyses,
} = require("../controllers/previousPaperController");

const router = express.Router();

// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      "-" +
      file.originalname;

    cb(null, uniqueName);
  },
});

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = function (req, file, cb) {
  if (
    file.mimetype === "application/pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed."));
  }
};

// =====================================================
// UPLOAD
// =====================================================

const upload = multer({
  storage: storage,

  limits: {
    files: 5,
    fileSize: 20 * 1024 * 1024,
  },

  fileFilter: fileFilter,
});

// =====================================================
// POST - ANALYZE PREVIOUS PAPERS
// =====================================================

router.post(
  "/analyze",
  upload.array("files", 5),
  analyzePreviousPapers
);

// =====================================================
// GET - SAVED ANALYSES
// =====================================================
router.get("/saved", getSavedAnalyses);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;