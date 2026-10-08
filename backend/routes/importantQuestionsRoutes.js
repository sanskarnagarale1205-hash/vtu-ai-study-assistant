const express = require("express");
const {
  generateImportantQuestions,
} = require("../controllers/importantQuestionsController");

const router = express.Router();

// POST /api/important-questions/generate
router.post("/generate", generateImportantQuestions);

module.exports = router;