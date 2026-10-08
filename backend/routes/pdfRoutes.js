const express = require("express");
const multer = require("multer");

const {
  uploadPDF,
} = require("../controllers/pdfController");

const router = express.Router();

// =================================================
// STORAGE
// =================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
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

// =================================================
// FILE FILTER
// =================================================

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/pdf" ||
    file.originalname
      .toLowerCase()
      .endsWith(".pdf")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PDF files are allowed."
      ),
      false
    );
  }
};

// =================================================
// MULTER
// =================================================

const upload = multer({
  storage,

  limits: {
    // Maximum size of EACH PDF
    fileSize: 100 * 1024 * 1024,

    // Maximum 10 PDFs
    files: 10,
  },

  fileFilter,
});

// =================================================
// UPLOAD ROUTE
// =================================================

router.post(
  "/upload",
  upload.array("pdfs", 10),
  uploadPDF
);

// =================================================
// MULTER ERROR HANDLER
// =================================================

router.use(
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      console.error(
        "❌ PDF upload middleware error:",
        err.message
      );

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message:
            "PDF file is too large. Maximum allowed size is 100 MB per PDF.",
        });
      }

      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(413).json({
          success: false,
          message:
            "Too many PDF files. Maximum 10 PDFs are allowed.",
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    if (err) {
      console.error(
        "❌ PDF upload middleware error:",
        err.message
      );

      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    next();
  }
);

module.exports = router;