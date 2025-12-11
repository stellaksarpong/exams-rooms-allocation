const express = require("express");
const router = express.Router();

const allocationController = require("../controllers/allocationController");

// Create allocation
router.post("/", allocationController.createAllocation);

// Get all allocations
router.get("/", allocationController.getAllocations);

// Delete allocation
router.delete("/:id", allocationController.deleteAllocation);

module.exports = router;
