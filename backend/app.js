const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Study Assistant Backend Running",
  });
});

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/user", userRoutes);

app.use("/api/pdf", pdfRoutes);

app.use("/api/ai", aiRoutes);

module.exports = app;