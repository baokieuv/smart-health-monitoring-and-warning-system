const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const connectDB = require('../config/database');

const adminPass = process.env.ADMIN_PASS || 'admin';

connectDB();

async function seedAdmin() {
    const admin = await User.findOne({ username: "admin" });
    if (admin) {
        console.log("Admin already exists");
        return process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const pashedPassword = await bcrypt.hash(adminPass, salt);
    
    await User.create({
        username: "admin",
        password: pashedPassword,
        role: "admin"
    });

    console.log("Admin seeded successfully");
    process.exit();
}

seedAdmin();
