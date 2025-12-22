const Patient = require('../models/patient.model');
const Doctor = require('../models/doctor.model');
const User = require('../models/user.model');
const { sendAlarmEmail } = require('./email.service');
const { emitAlarmToDoctor } = require('../socket');

/**
 * Process alarm from ThingsBoard and send notifications (Email + Socket.io)
 */
async function processAlarm(alarmPayload) {
    try {
        console.log('Processing alarm:', alarmPayload);

        const { deviceId, alarmType, severity, data } = alarmPayload;

        // Find patient by deviceId
        const patient = await Patient.findOne({ deviceId });
        if (!patient) {
            console.error('Patient not found for device:', deviceId);
            return {
                success: false,
                message: 'Patient not found'
            };
        }

        // Find doctor
        const doctor = await Doctor.findOne({ userId: patient.doctorId });
        if (!doctor) {
            console.error('Doctor not found for patient:', patient._id);
            return {
                success: false,
                message: 'Doctor not found'
            };
        }

        console.log(`Sending alarm notification to doctor: ${doctor.full_name} (${doctor.email})`);
        console.log(`Doctor userId: ${doctor.userId}, Patient: ${patient.full_name}`);
        console.log(`Will emit to room: doctor:${doctor.userId.toString()}`);

        // Prepare notification data
        const notificationData = {
            id: `alarm_${Date.now()}`,
            deviceId,
            alarmType,
            severity,
            data,
            patient: {
                id: patient._id,
                full_name: patient.full_name,
                cccd: patient.cccd,
                room: patient.room
            },
            timestamp: new Date().toISOString(),
            read: false
        };

        // Send Socket.io realtime notification
        try {
            emitAlarmToDoctor(doctor.userId.toString(), notificationData);
            console.log('Socket.io notification sent successfully');
        } catch (socketError) {
            console.error('Failed to send socket notification:', socketError);
        }

        // Send email notification
        try {
            await sendAlarmEmail(doctor, patient, alarmPayload);
            console.log('Email sent successfully to', doctor.email);
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
        }

        return {
            success: true,
            message: 'Notification sent successfully',
            patient: patient.full_name,
            doctor: doctor.full_name
        };
    } catch (error) {
        console.error('Process alarm error:', error);
        throw error;
    }
}

module.exports = {
    processAlarm
};
