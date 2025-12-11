const express = require("express");
const router = express.Router();

const examController = require("../controllers/examController");

// Create exam
router.post("/", examController.createExam);

// Get all exams
router.get("/", examController.getExams);

// Update exam
router.put("/:id", examController.updateExam);

// Delete exam
router.delete("/:id", examController.deleteExam);

module.exports = router;
