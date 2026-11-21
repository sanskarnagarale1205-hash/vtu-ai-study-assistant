const mongoose = require("mongoose");

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    subject: { type: String, required: true, trim: true, maxlength: 100 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    duration: { type: Number, required: true, min: 5, max: 480 },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudyPlan", studyPlanSchema);
