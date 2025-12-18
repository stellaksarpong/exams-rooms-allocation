const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    indexNumber: {
      type: String,
      required: true,
      unique: true,
      minlength: 10,
      maxlength: 10,
      trim: true,
    },
    name: { type: String, required: true },
    course: { type: String },
    level: {
      type: Number,
      enum: [100, 200, 300, 400],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", StudentSchema);
