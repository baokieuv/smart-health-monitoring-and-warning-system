const bcrypt = require('bcryptjs');
const patientRepository = require('../repositories/patient.repository');
const doctorRepository = require('../repositories/doctor.repository');
const userRepository = require('../repositories/user.repository');
const deviceRepository = require('../repositories/device.repository');
const thingsBoardService = require('./thingsboard.service');
const tokenStore = require('../utils/tokenStore.util');
const logger = require('../utils/logger.util');
const { 
    ConflictError, 
    NotFoundError, 
    BadRequestError,
    ServiceUnavailableError
} = require('../errors');
const { ROLES, PASSWORD_SALT_ROUNDS, CCCD_LENGTH } = require('../config/constants');

class PatientService {
    async createPatient(patientData) {
        // Check for duplicate CCCD
        const existingPatient = await patientRepository.findByCCCD(patientData.cccd);
        if (existingPatient) {
            throw new ConflictError('Patient with this CCCD already exists');
        }

        // Hash password (use phone as default password)
        const hashedPassword = await bcrypt.hash(patientData.phone, PASSWORD_SALT_ROUNDS);

        // Create user
        const user = await userRepository.create({
            username: patientData.cccd,
            password: hashedPassword,
            role: ROLES.PATIENT
        });

        // Create patient
        const patient = await patientRepository.create({
            ...patientData,
            userId: user._id
        });

        logger.info(`Patient created successfully: ${patient._id}`);
        return patient;
    }

    async getPatients(searchTerm, page, limit) {
        const result = await patientRepository.searchPatients(searchTerm, page, limit);

        // Populate doctor information
        const patientsWithDoctors = await Promise.all(
            result.data.map(async (patient) => {
                if (patient.doctorId) {
                    const doctor = await doctorRepository.findByUserId(patient.doctorId);
                    if (doctor) {
                        return {
                            ...patient,
                            doctor: {
                                full_name: doctor.full_name,
                                specialization: doctor.specialization
                            }
                        };
                    }
                }
                return patient;
            })
        );

        return {
            ...result,
            data: patientsWithDoctors
        };
    }

    async getPatientById(patientId) {
        const patient = await patientRepository.findById(patientId);
        if (!patient) {
            throw new NotFoundError('Patient not found');
        }

        logger.info(`Patient retrieved successfully: ${patientId}`);
        return patient;
    }

    async getPatientByUserId(userId) {
        const patient = await patientRepository.findByUserId(userId);
        if (!patient) {
            throw new NotFoundError('Patient not found');
        }

        logger.info(`Patient retrieved by userId: ${userId}`);
        return patient;
    }

    async updatePatient(patientId, updateData) {
        const patient = await patientRepository.findById(patientId);
        if (!patient) {
            throw new NotFoundError('Patient not found');
        }

        const updatedPatient = await patientRepository.updateById(patientId, updateData);
        logger.info(`Patient updated successfully: ${patientId}`);
        return updatedPatient;
    }

    async deletePatient(patientId, userId) {
        const patient = await patientRepository.findById(patientId);
        if (!patient) {
            throw new NotFoundError('Patient not found');
        }

        // Delete device from ThingsBoard if exists
        if (patient.deviceId) {
            try {
                const token = tokenStore.findThingsBoardToken(userId);
                if (token) {
                    await thingsBoardService.deleteDevice(patient.deviceId, token);
                }
            } catch (err) {
                logger.warn(`Failed to delete device ${patient.deviceId}:`, err.message);
            }
        }

        // Delete related records
        await userRepository.deleteById(patient.userId);
        await patientRepository.deleteById(patient._id);
        if (patient.deviceId) {
            await deviceRepository.deleteByDeviceId(patient.deviceId);
        }

        logger.info(`Patient deleted successfully: ${patientId}`);
        return patient._id;
    }

    async getHealthInfo(patientId, userId) {
        const patient = await patientRepository.findById(patientId);
        if (!patient) {
            throw new NotFoundError('Patient not found');
        }

        if (!patient.deviceId) {
            throw new BadRequestError('Patient is not allocated device');
        }

        // Get or refresh ThingsBoard token
        let token = tokenStore.findThingsBoardToken(userId);
        if (!token) {
            logger.info('Attempting to login to ThingsBoard...');
            token = await thingsBoardService.login({ type: 'tenant' });
            tokenStore.saveThingsBoardToken(userId, token, Date.now() + 7 * 24 * 60 * 60 * 1000);
        }

        // Get telemetry data
        const telemetryData = await thingsBoardService.getTelemetry(patient.deviceId, token);
        const healthInfo = thingsBoardService.parseTelemetryData(telemetryData);

        logger.info(`Patient health info retrieved: ${patientId}`);
        return {
            patientId: patient._id,
            healthInfo
        };
    }

    async allocateDevice(patientId, userId) {
        const patient = await patientRepository.findById(patientId);
        if (!patient) {
            throw new NotFoundError('Patient not found');
        }

        if (patient.deviceId) {
            throw new BadRequestError('Patient already has a device allocated');
        }

        // Get or refresh ThingsBoard token
        let token = tokenStore.findThingsBoardToken(userId);
        if (!token) {
            token = await thingsBoardService.login({ type: 'tenant' });
            tokenStore.saveThingsBoardToken(userId, token, Date.now() + 7 * 24 * 60 * 60 * 1000);
        }

        // Find device by patient CCCD
        const deviceInfo = await thingsBoardService.findDeviceByAttributes(patient.cccd, token);
        if (!deviceInfo) {
            throw new BadRequestError('No device found for this patient');
        }

        // Get doctor CCCD from attributes
        const doctorAttr = deviceInfo.attributes.find(attr => attr.key === 'doctor');
        const doctorCCCD = doctorAttr 
            ? String(doctorAttr.value).padStart(CCCD_LENGTH, '0')
            : null;

        // Find doctor
        const doctor = doctorCCCD 
            ? await doctorRepository.findByCCCD(doctorCCCD)
            : null;

        // Update patient with device ID
        await patientRepository.updateDeviceId(patient._id, deviceInfo.deviceId);

        // Create device record
        await deviceRepository.create({
            name: deviceInfo.deviceName,
            deviceId: deviceInfo.deviceId,
            doctorCCCD,
            patientCCCD: patient.cccd,
            doctorId: doctor?._id,
            patientId: patient._id
        });

        logger.info(`Device allocated successfully: ${patientId}`);
        return deviceInfo.deviceId;
    }

    async recallDevice(patientId, userId) {
        const patient = await patientRepository.findById(patientId);
        if (!patient) {
            throw new NotFoundError('Patient not found');
        }

        if (!patient.deviceId) {
            throw new BadRequestError('Patient does not have any device allocated');
        }

        // Delete device from ThingsBoard
        try {
            const token = tokenStore.findThingsBoardToken(userId);
            if (token) {
                await thingsBoardService.deleteDevice(patient.deviceId, token);
            }
        } catch (err) {
            logger.warn(`Failed to delete device ${patient.deviceId}:`, err.message);
        }

        // Clear device ID and delete device record
        const deviceId = patient.deviceId;
        await patientRepository.clearDeviceId(patient._id);
        await deviceRepository.deleteByDeviceId(deviceId);

        logger.info(`Device recalled successfully: ${patientId}`);
        return deviceId;
    }
}

module.exports = new PatientService();