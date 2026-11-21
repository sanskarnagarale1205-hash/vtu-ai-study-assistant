const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subject: { type: String, required: true },
    module: { type: String, default: "" },
    difficulty: { type: String, default: "Mixed" },
    totalQuestions: { type: Number, required: true },
    score: { type: Number, required: true },
    percentage: { type: Number, required: true },
    timeTaken: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizResult", quizResultSchema);