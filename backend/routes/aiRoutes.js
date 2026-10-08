const express = require("express");

const router = express.Router();

const {
  chatWithAI,
  generateImportantQuestions,
  generateQuiz,
} = require("../controllers/aiController");

const authMiddleware = require("../middleware/authMiddleware");


// AI CHAT
router.post(
  "/chat",
  authMiddleware,
  chatWithAI
);


// IMPORTANT QUESTIONS
router.post(
  "/important-questions",
  authMiddleware,
  generateImportantQuestions
);


// QUIZ
router.post(
  "/quiz",
  authMiddleware,
  generateQuiz
);


module.exports = router;