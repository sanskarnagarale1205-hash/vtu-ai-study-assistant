const mongoose = require("mongoose");

const previousPaperAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    subject: {
      type: String,
      required: true,
    },

    fileNames: {
      type: [String],
      default: [],
    },

    analysis: {
      type: String,
      required: true,
    },

    totalFiles: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PreviousPaperAnalysis",
  previousPaperAnalysisSchema
);