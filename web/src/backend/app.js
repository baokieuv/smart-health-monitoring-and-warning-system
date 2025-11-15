const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const doctorRoutes = require('./routes/doctor.routes');
const familyRoutes = require('./routes/family.routes');
const connectDB = require('./config/database');

const app = express();
app.use(helmet());
app.use(express.json());

connectDB();

//routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctor/patients', patientRoutes);
app.use('/api/v1/admin/doctors', doctorRoutes);
app.use('/api/v1/family', familyRoutes);

// ============= ERROR HANDLERS =============
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: "Endpoint not found."
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        status: "error",
        message: "Unexpected error occurred."
    });
});

module.exports = app;