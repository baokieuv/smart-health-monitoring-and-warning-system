const express = require('express');
const helmet = require('helmet');
const patientRoutes = require('./routes/patient.routes');
const doctorRoutes = require('./routes/doctor.routes');

const app = express();
app.use(helmet());
app.use(express.json())

//routes
app.use('/api/v1/doctor/patients', patientRoutes);
app.use('/api/v1/admin/doctors', doctorRoutes);

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