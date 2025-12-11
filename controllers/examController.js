const Exam = require("../models/exam");

// Create exam
exports.createExam = async (req, res) => {
    try {
        const exam = new Exam(req.body);
        await exam.save();
        res.status(201).json(exam);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all exams
exports.getExams = async (req, res) => {
    try {
        const exams = await Exam.find();
        res.status(200).json(exams);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update exam
exports.updateExam = async (req, res) => {
    try {
        const updated = await Exam.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: "Exam not found" });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete exam
exports.deleteExam = async (req, res) => {
    try {
        const removed = await Exam.findByIdAndDelete(req.params.id);
        if (!removed) return res.status(404).json({ error: "Exam not found" });
        res.json({ message: "Exam deleted successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
