const express = require("express");
const router = express.Router();

//
const allocationController = require("../controllers/allocationController");

// Create allocation
router.post("/", allocationController.createAllocation);

// Get all allocations
router.get("/", allocationController.getAllocations);

//Get for specific student
router.get("/student/:studentId", allocationController.getStudentAllocation);

// Delete allocation
router.delete("/:id", allocationController.deleteAllocation);

//
router.get("/export/csv", allocationController.exportAllocationsCSV);

//
router.get("/export/pdf", allocationController.exportAllocationsPDF);

module.exports = router;
