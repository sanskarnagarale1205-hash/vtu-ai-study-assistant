const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getStudyPlans,
  createStudyPlan,
  updateStudyPlan,
  deleteStudyPlan,
} = require("../controllers/studyPlanController");

const router = express.Router();

router.get("/", authMiddleware, getStudyPlans);
router.post("/", authMiddleware, createStudyPlan);
router.patch("/:id", authMiddleware, updateStudyPlan);
router.delete("/:id", authMiddleware, deleteStudyPlan);

module.exports = router;
