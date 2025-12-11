const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  duration: { type: Number, required: true }, // in minutes
  examCode: { type: String, required: true },
  date: { type: Date }
});

module.exports = mongoose.model("Exam", examSchema);
