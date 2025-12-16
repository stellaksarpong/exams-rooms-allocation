const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.mongoURL);
        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.error("MongoDB Connection Failed:", error);
        process.exit(1); // stop server if DB fails
    }
};

module.exports = connectDB;
