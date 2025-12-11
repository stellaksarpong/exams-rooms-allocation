const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
    examCode: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    date: { type: Date, required: true },
    duration: { type: Number, required: true }, // duration in minutes
},{ timestamps: true});

module.exports = mongoose.model("Exam", examSchema);