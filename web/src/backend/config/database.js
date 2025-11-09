// Connecting to database
const mongoose = require('mongoose');
require('dotenv').config();
const db = process.env.URL_DB;

const connectDB = async () => {
    try {
        // console.log("DB Connection String:", db);
        await mongoose.connect(db, {
            tls: true
        });
        console.log("MongoDB Connected!");
    } catch (error) {
        console.error("MongoDB Connection Failed!", error);
        process.exit(1);
    }
};
     
module.exports = connectDB;