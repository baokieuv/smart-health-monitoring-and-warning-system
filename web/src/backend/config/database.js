// // Connecting to database
// const mongoose = require('mongoose');
// require('dotenv').config();
// const db = process.env.MONGODB_URI; 

// const connectDB = async () => {
//     try {
//         if (!db) {
//             throw new Error("MONGODB_URI not found in .env file");
//         }
        
//         console.log("Connecting to MongoDB Atlas...");
//         await mongoose.connect(db, {
//             tls: true
//         });
//         console.log("MongoDB Connected!");
//         console.log("Database:", mongoose.connection.name);
//     } catch (error) {
//         console.error("MongoDB Connection Failed!", error.message);
//         process.exit(1);
//     }
// };
     
// module.exports = connectDB;

const mongoose = require('mongoose');
const logger = require('../utils/logger.util');

const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed through app termination');
            process.exit(0);
        });
    }catch(error){
        logger.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};

module.exports = connectDB;