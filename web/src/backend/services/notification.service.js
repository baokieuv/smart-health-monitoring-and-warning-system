const Patient = require('../models/patient.model');
const Doctor = require('../models/doctor.model');
const User = require('../models/user.model');
const { sendAlarmEmail } = require('./email.service');
const { emitAlarmToDoctor } = require('../socket');


// Key: `${doctor.userId}_${deviceId}`, Value: timestamp
const lastEmailSentMap = new Map();

const MIN_EMAIL_INTERVAL = 60 * 1000;

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
        console.log(`Doctor userId type: ${typeof doctor.userId}, value: "${doctor.userId.toString()}"`);
        console.log(`Will emit to room: doctor:${doctor.userId.toString()}`);

        
        const emailKey = `${doctor.userId}_${deviceId}`;
        const currentTime = Date.now();
        const lastEmailTime = lastEmailSentMap.get(emailKey);
        const shouldSendNoti = !lastEmailTime || (currentTime - lastEmailTime) >= MIN_EMAIL_INTERVAL;

        if (shouldSendNoti) {
            console.log('Email can be sent (last sent:', lastEmailTime ? new Date(lastEmailTime).toISOString() : 'never', ')');
        } else {
            const timeRemaining = Math.ceil((MIN_EMAIL_INTERVAL - (currentTime - lastEmailTime)) / 1000);
            console.log(`Email rate limit: ${timeRemaining} seconds remaining until next email can be sent`);
        }

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
            if (shouldSendNoti) {
                emitAlarmToDoctor(doctor.userId.toString(), notificationData);
                console.log('Socket.io notification sent successfully');
            } else {
                console.log('Socket.io notification skipped due to rate limiting');
            }
        } catch (socketError) {
            console.error('Failed to send socket notification:', socketError);
        }

        // Send email notification
        try {
            if (shouldSendNoti) {
                await sendAlarmEmail(doctor, patient, alarmPayload);
                lastEmailSentMap.set(emailKey, currentTime);
                console.log('Email sent successfully to', doctor.email);
            } else {
                console.log('Email skipped due to rate limiting');
            }
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
        }
        
        if (shouldSendNoti) {
            return {
                success: true,
                message: 'Notification sent successfully',
                patient: patient.full_name,
                doctor: doctor.full_name,
                // emailSent: shouldSendNoti
            }
        } else {
            return {
                success: false,
                message: 'Notification skipped due to rate limiting',
                patient: patient.full_name,
                doctor: doctor.full_name,
            }
        }
    } catch (error) {
        console.error('Process alarm error:', error);
        throw error;
    }
}

module.exports = {
    processAlarm
};
