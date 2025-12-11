require('dotenv').config();
const express =require('express');
const mongoose = require ('mongoose');
const cors = require ('cors');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// import routes
const studentRoutes = require ('./routes/studentRoutes');
const examRoutes = require ('./routes/examRoutes');
const roomRoutes = require ('./routes/roomRoutes');
const allocationRoutes = require ('./routes/allocationRoutes');

//use routes
app.use("/api/students",studentRoutes);
app.use("/api/exams",examRoutes);
app.use("/api/rooms",roomRoutes);
app.use("/api/allocations",allocationRoutes);


// connect to mongodb
mongoose
.connect(process.env.mongoURL)
.then(()=> console.log("Connected to MongoDB"))
.catch((err)=>console.error("Could to the MonngoDB",err))


// app.get('/',(req,res)=>{
//     res.send('Hello World!');
// })

const port = process.env.port || 3000;
app.listen (port,()=>{
    console.log(`server is running on http://localhost:${port}`);
})
