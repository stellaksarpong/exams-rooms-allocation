const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema({
    exam:{ type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    room:{ type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    students:{ type: [mongoose.Schema.Types.ObjectId], ref: 'Student', required: true },
},{ timestamps: true});

module.exports = mongoose.model("Allocation", allocationSchema);