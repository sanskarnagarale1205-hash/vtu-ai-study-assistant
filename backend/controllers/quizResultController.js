const QuizResult = require("../models/QuizResult");

const saveQuizResult = async (req, res) => {
  try {
    const { subject, module, difficulty, totalQuestions, score, timeTaken } =
      req.body;

    const total = Number(totalQuestions);
    const points = Number(score);

    if (typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject is required.",
      });
    }

    if (
      !Number.isInteger(total) ||
      total < 1 ||
      total > 50 ||
      !Number.isInteger(points) ||
      points < 0 ||
      points > total
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid score or question count.",
      });
    }

    const saved = await QuizResult.create({
      userId: req.user.id,
      subject: subject.trim().slice(0, 150),
      module: typeof module === "string" ? module : "",
      difficulty: typeof difficulty === "string" ? difficulty : "Mixed",
      totalQuestions: total,
      score: points,
      percentage: Math.round((points / total) * 100),
      timeTaken: Math.max(0, Number(timeTaken) || 0),
    });

    return res.status(201).json({ success: true, result: saved });
  } catch (error) {
    console.error("SAVE QUIZ RESULT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save the quiz result.",
    });
  }
};

const getQuizResults = async (req, res) => {
  try {
    const results = await QuizResult.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("GET QUIZ RESULTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load quiz results.",
    });
  }
};

module.exports = { saveQuizResult, getQuizResults };