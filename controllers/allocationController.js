const Allocation = require("../models/allocation");
const Room = require("../models/room");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

// CREATE allocation with seat numbering
exports.createAllocation = async (req, res) => {
  try {
    const { exam, room, students } = req.body;

    // 1. Check if room exists
    const selectedRoom = await Room.findById(room);
    if (!selectedRoom) {
      return res.status(404).json({ error: "Room not found" });
    }

    // 2. Check room capacity
    if (students.length > selectedRoom.capacity) {
      return res.status(400).json({
        error: "Room capacity exceeded",
      });
    }

    // 3. Assign seat numbers automatically
    const studentsWithSeats = students.map((studentId, index) => ({
      student: studentId,
      seatNumber: index + 1,
    }));

    // 4. Save allocation
    const allocation = new Allocation({
      exam,
      room,
      students: studentsWithSeats,
    });

    await allocation.save();

    res.status(201).json(allocation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET all allocations
exports.getAllocations = async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate("exam")
      .populate("room")
      .populate("students.student");

    res.status(200).json(allocations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET allocation for a specific student
exports.getStudentAllocation = async (req, res) => {
  try {
    const studentId = req.params.studentId;

    // Find allocation that includes this student
    const allocation = await Allocation.findOne({
      "students.student": studentId,
    })
      .populate("exam")
      .populate("room")
      .populate("students.student");

    if (!allocation) {
      return res.status(404).json({ error: "Allocation not found" });
    }

    // Find seat info for this student
    const studentInfo = allocation.students.find(
      (s) => s.student._id.toString() === studentId
    );

    res.json({
      exam: allocation.exam.subject || allocation.exam.name,
      room: allocation.room.roomNumber || allocation.room.name,
      seatNumber: studentInfo ? studentInfo.seatNumber : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE allocation
exports.deleteAllocation = async (req, res) => {
  try {
    const removed = await Allocation.findByIdAndDelete(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: "Allocation not found" });
    }

    res.json({ message: "Allocation deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Export all allocations as CSV
exports.exportAllocationsCSV = async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate("exam")
      .populate("room")
      .populate("students.student");

    const data = [];
    allocations.forEach((allocation) => {
      const examLabel =
        (allocation.exam &&
          (allocation.exam.subject || allocation.exam.name)) ||
        "";
      const roomLabel =
        (allocation.room &&
          (allocation.room.roomNumber || allocation.room.name)) ||
        "";
      allocation.students.forEach((s) => {
        const studentObj = s.student;
        const studentName =
          studentObj && typeof studentObj === "object"
            ? studentObj.name || ""
            : typeof studentObj === "string"
            ? studentObj
            : "";
        const studentIndex =
          studentObj && typeof studentObj === "object"
            ? studentObj.indexNumber || ""
            : "";
        data.push({
          Exam: examLabel,
          Room: roomLabel,
          Student: studentName,
          "Seat Number": s.seatNumber || "",
          "Student Index": studentIndex,
        });
      });
    });

    const parser = new Parser();
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("allocations.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export allocations as PDF
exports.exportAllocationsPDF = async (req, res) => {
  try {
    const allocations = await Allocation.find()
      .populate("exam")
      .populate("room")
      .populate("students.student");

    const doc = new PDFDocument({ margin: 30, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=allocations.pdf"
    );
    doc.pipe(res);

    doc.fontSize(20).text("Student Allocations", { align: "center" });
    doc.moveDown();

    allocations.forEach((allocation) => {
      const examLabel =
        (allocation.exam &&
          (allocation.exam.subject || allocation.exam.name)) ||
        "";
      const roomLabel =
        (allocation.room &&
          (allocation.room.roomNumber || allocation.room.name)) ||
        "";
      doc.fontSize(16).text(`Exam: ${examLabel} | Room: ${roomLabel}`);
      allocation.students.forEach((s) => {
        const studentObj = s.student;
        const studentName =
          studentObj && typeof studentObj === "object"
            ? studentObj.name || ""
            : typeof studentObj === "string"
            ? studentObj
            : "";
        const studentIndex =
          studentObj && typeof studentObj === "object"
            ? studentObj.indexNumber || ""
            : "";
        const seat = s.seatNumber || "";
        doc
          .fontSize(12)
          .text(
            `Student: ${studentName} | Index: ${studentIndex} | Seat: ${seat}`
          );
      });
      doc.moveDown();
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
