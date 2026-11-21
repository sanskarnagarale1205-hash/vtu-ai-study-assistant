const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const {
  saveQuizResult,
  getQuizResults,
} = require("../controllers/quizResultController");

const router = express.Router();

router.post("/", authMiddleware, saveQuizResult);
router.get("/", authMiddleware, getQuizResults);

module.exports = router;