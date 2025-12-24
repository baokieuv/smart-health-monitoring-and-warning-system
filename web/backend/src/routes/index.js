const express = require('express');
const authRoutes = require('./auth.routes');
const doctorRoutes = require('./doctor.routes');
const patientRoutes = require('./patient.routes');
const familyRoutes = require('./family.routes');
const userRoutes = require('./user.routes');
const notificationRoutes = require('./notification.routes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
router.use('/auth', authRoutes);
router.use('/admin', doctorRoutes);
router.use('/doctor', patientRoutes);
router.use('/family', familyRoutes);
router.use('/user', userRoutes);
router.use('/thingsboard', notificationRoutes);

module.exports = router;