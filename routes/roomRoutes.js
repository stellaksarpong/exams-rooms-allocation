const express = require("express");
const router = express.Router();

const roomController = require("../controllers/roomController");

// Create room
router.post("/", roomController.createRoom);

// Get all rooms
router.get("/", roomController.getRooms);

// Update room
router.put("/:id", roomController.updateRoom);

// Delete room
router.delete("/:id", roomController.deleteRoom);

module.exports = router;
