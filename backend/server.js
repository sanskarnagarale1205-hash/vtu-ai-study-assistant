require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const authRoutes = require("./routes/authRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const aiRoutes = require("./routes/aiRoutes");
const previousPaperRoutes = require("./routes/previousPaperRoutes");
const importantQuestionsRoutes = require("./routes/importantQuestionsRoutes");
const quizResultRoutes = require("./routes/quizResultRoutes");
const studyPlanRoutes = require("./routes/studyPlanRoutes");

const app = express();

// =====================================================
// UPLOAD FOLDER
// =====================================================

const uploadFolder = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, {
    recursive: true,
  });
}

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "20mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "20mb",
  })
);

// =====================================================
// STATIC FILES
// =====================================================

app.use(
  "/uploads",
  express.static(uploadFolder)
);

// =====================================================
// TEST
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Study Assistant Backend Running",
  });
});

// =====================================================
// API ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/pdf", pdfRoutes);

app.use("/api/ai", aiRoutes);
app.use(
  "/api/important-questions",
  importantQuestionsRoutes
);
app.use("/api/quiz-results", quizResultRoutes);
app.use("/api/study-plans", studyPlanRoutes);
// IMPORTANT: singular previous-paper
app.use(
  "/api/previous-papers",
  previousPaperRoutes
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  console.log("❌ Route not found:", req.method, req.originalUrl);

  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err);

  res.status(500).json({
    success: false,
    message: err.message || "Server error",
  });
});

// =====================================================
// MONGODB
// =====================================================

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(
        `🚀 Server is running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "❌ MongoDB Connection Error:",
      error.message
    );
  });