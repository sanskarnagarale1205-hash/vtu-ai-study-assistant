const StudyPlan = require("../models/StudyPlan");

const getStudyPlans = async (req, res) => {
  try {
    const plans = await StudyPlan.find({ userId: req.user.id }).sort({
      date: 1,
      createdAt: -1,
    });
    return res.status(200).json({ success: true, plans });
  } catch (error) {
    console.error("GET STUDY PLANS ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to load study plans." });
  }
};

const createStudyPlan = async (req, res) => {
  try {
    const { title, subject, date, duration, priority } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ success: false, message: "Task title is required." });
    }
    if (typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ success: false, message: "Subject is required." });
    }
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: "A valid date is required." });
    }

    const minutes = Number(duration);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 480) {
      return res.status(400).json({ success: false, message: "Duration must be between 5 and 480 minutes." });
    }

    const plan = await StudyPlan.create({
      userId: req.user.id,
      title: title.trim(),
      subject: subject.trim(),
      date,
      duration: minutes,
      priority: ["Low", "Medium", "High"].includes(priority) ? priority : "Medium",
    });

    return res.status(201).json({ success: true, plan });
  } catch (error) {
    console.error("CREATE STUDY PLAN ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to create study plan." });
  }
};

const updateStudyPlan = async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ _id: req.params.id, userId: req.user.id });
    if (!plan) {
      return res.status(404).json({ success: false, message: "Study plan not found." });
    }

    if (typeof req.body.completed === "boolean") plan.completed = req.body.completed;
    if (typeof req.body.title === "string" && req.body.title.trim()) plan.title = req.body.title.trim();
    await plan.save();

    return res.status(200).json({ success: true, plan });
  } catch (error) {
    console.error("UPDATE STUDY PLAN ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to update study plan." });
  }
};

const deleteStudyPlan = async (req, res) => {
  try {
    const deleted = await StudyPlan.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Study plan not found." });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("DELETE STUDY PLAN ERROR:", error);
    return res.status(500).json({ success: false, message: "Failed to delete study plan." });
  }
};

module.exports = { getStudyPlans, createStudyPlan, updateStudyPlan, deleteStudyPlan };
