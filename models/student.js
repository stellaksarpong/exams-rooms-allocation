const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  indexNumber: { type: String, required: true, unique: true }, 
  name: { type: String, required: true },
  programme: { type: String },
  level: { type: String },

},{ timestamps: true});

module.exports = mongoose.model("Student", StudentSchema);
