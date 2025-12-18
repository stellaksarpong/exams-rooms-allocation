const Student = require("../models/student");
const XLSX = require("xlsx");
const multer = require("multer");

// Create a student
exports.createStudent = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (
      payload.level === "" ||
      payload.level === null ||
      payload.level === undefined
    )
      delete payload.level;
    else payload.level = Number(payload.level);
    if (payload.indexNumber)
      payload.indexNumber = String(payload.indexNumber).trim();
    const student = new Student(payload);
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all students
exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a student by ID
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a student
exports.updateStudent = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (
      payload.level === "" ||
      payload.level === null ||
      payload.level === undefined
    )
      delete payload.level;
    else payload.level = Number(payload.level);
    if (payload.indexNumber)
      payload.indexNumber = String(payload.indexNumber).trim();
    const updated = await Student.findByIdAndUpdate(req.params.id, payload, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Student not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a student
exports.deleteStudent = async (req, res) => {
  try {
    const removed = await Student.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ error: "Student not found" });
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload Excel and create students
exports.uploadStudents = [
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      const students = data.map((row) => ({
        name: row.name || row.Name || "",
        indexNumber: String(
          row.indexNumber || row.IndexNumber || row.Index || ""
        ).trim(),
        course: row.course || row.Course || row.Department || "",
        level:
          row.level || row.Level ? Number(row.level || row.Level) : undefined,
      }));

      const inserted = await Student.insertMany(students, { ordered: false });
      res.json({ message: `${inserted.length} students added` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
];

// GET /students/search?index=12345
exports.searchStudentByIndex = async (req, res) => {
  try {
    const { index } = req.query;
    const student = await Student.findOne({ indexNumber: index });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
