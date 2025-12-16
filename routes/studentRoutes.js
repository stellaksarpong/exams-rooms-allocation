const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");

// Create a student
router.post("/", studentController.createStudent);

// Get all students
router.get("/", studentController.getStudents);

// Get a student by ID
router.get("/:id", studentController.getStudentById);

// Update student by ID
router.put("/:id", studentController.updateStudent);

// Delete student by ID
router.delete("/:id", studentController.deleteStudent);

// new Excel upload route

router.post("/upload", studentController.uploadStudents)

router.get("/search", studentController.searchStudentByIndex);


module.exports = router;
