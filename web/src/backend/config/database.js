// Connecting to database
const mongoose = require('mongoose');
require('dotenv').config();
const db = process.env.MONGODB_URI; 

const connectDB = async () => {
    try {
        if (!db) {
            throw new Error('MONGODB_URI not found in .env file');
        }
        
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(db, {
            tls: true
        });
        console.log("MongoDB Connected!");
        console.log("Database:", mongoose.connection.name);
    } catch (error) {
        console.error("MongoDB Connection Failed!", error.message);
        process.exit(1);
    }
};
     
module.exports = connectDB;