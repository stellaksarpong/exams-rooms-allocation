require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
// middlewares
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// import routes
const studentRoutes = require("./routes/studentRoutes");
const examRoutes = require("./routes/examRoutes");
const roomRoutes = require("./routes/roomRoutes");
const allocationRoutes = require("./routes/allocationRoutes");

//use routes ;
app.use("/api/students", studentRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/allocations", allocationRoutes);

// Serve frontend static files
app.use(express.static(path.join(__dirname, "frontend")));

// connect to mongodb
connectDB();

//Test root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

//Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
