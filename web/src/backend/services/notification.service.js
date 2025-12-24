const patientRepository = require('../repositories/patient.repository');
const doctorRepository = require('../repositories/doctor.repository');
const emailService = require('./email.service');
const { emitAlarmToDoctor } = require('../config/socket.config');
const logger = require('../utils/logger.util');

class NotificationService {
    async processAlarm(alarmPayload) {
        const { deviceId, alarmType, severity, data } = alarmPayload;

        logger.info('Processing alarm:', alarmPayload);

        // Find patient by deviceId
        const patient = await patientRepository.findByDeviceId(deviceId);
        if (!patient) {
            logger.error('Patient not found for device:', deviceId);
            return {
                success: false,
                message: 'Patient not found'
            };
        }

        // Find doctor
        const doctor = await doctorRepository.findByUserId(patient.doctorId);
        if (!doctor) {
            logger.error('Doctor not found for patient:', patient._id);
            return {
                success: false,
                message: 'Doctor not found'
            };
        }

        logger.info(`Sending alarm to doctor: ${doctor.full_name} (${doctor.email})`);

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
            logger.info('Socket.io notification sent successfully');
        } catch (socketError) {
            logger.error('Failed to send socket notification:', socketError);
        }

        // Send email notification
        try {
            await emailService.sendAlarmEmail(doctor, patient, alarmPayload);
            logger.info('Email sent successfully to', doctor.email);
        } catch (emailError) {
            logger.error('Failed to send email:', emailError);
        }

        return {
            success: true,
            message: 'Notification sent successfully',
            patient: patient.full_name,
            doctor: doctor.full_name
        };
    }
}

module.exports = new NotificationService();