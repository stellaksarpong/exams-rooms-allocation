const Allocation = require("../models/allocation");
const Room = require("../models/room");

// Allocate students to a room for an exam, create allocation
exports.createAllocation = async (req, res) => {
    try {
        const { exam, room, students } = req.body;

        // validate room capacity
        const selectedRoom = await Room.findById(room);
        if (!selectedRoom)
            return res.status(404).json({ error: "Room not found" });

        if (students.length > selectedRoom.capacity)
            return res.status(400).json({
                error: "Room capacity exceeded",
            });

        const allocation = new Allocation({ exam, room, students });
        await allocation.save();

        res.status(201).json(allocation);

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all allocations
exports.getAllocations = async (req, res) => {
    try {
        const allocations = await Allocation.find()
            .populate("exam")
            .populate("room")
            .populate("students");

        res.status(200).json(allocations);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete allocation
exports.deleteAllocation = async (req, res) => {
    try {
        const removed = await Allocation.findByIdAndDelete(req.params.id);
        if (!removed)
            return res.status(404).json({ error: "Allocation not found" });

        res.json({ message: "Allocation deleted" });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
