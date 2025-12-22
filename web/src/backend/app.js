const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const doctorRoutes = require('./routes/doctor.routes');
const familyRoutes = require('./routes/family.routes');
const userRoutes = require('./routes/user.routes');
const thingsboardRoutes = require('./routes/thingsboard.routes');
const connectDB = require('./config/database');

const app = express();

// CORS configuration - Allow frontend to call backend
app.use(cors({
  origin: process.env.REACT_APP_BASE_FE || 'http://localhost:3000',
  credentials: true
}));

app.use(helmet());
app.use(express.json());

connectDB();

//routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/doctor', patientRoutes);
app.use('/api/v1/admin', doctorRoutes);
app.use('/api/v1/family', familyRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/thingsboard', thingsboardRoutes);

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