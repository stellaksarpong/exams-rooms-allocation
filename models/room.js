const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true },
    roomFloor: { type: Number, required: true },
    capacity: { type: Number, required: true },
    building:{ type: String, required: true }

},{ timestamps: true});

module.exports = mongoose.model("Room", RoomSchema);