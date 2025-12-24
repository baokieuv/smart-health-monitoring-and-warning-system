const bcrypt = require('bcryptjs');
const doctorRepository = require('../repositories/doctor.repository');
const userRepository = require('../repositories/user.repository');
const deviceRepository = require('../repositories/device.repository');
const logger = require('../utils/logger.util');
const { 
    ConflictError, 
    NotFoundError, 
    ForbiddenError 
} = require('../errors');
const { ROLES, PASSWORD_SALT_ROUNDS } = require('../config/constants');

class DoctorService {
    async createDoctor(doctorData) {
        // Check for duplicate CCCD
        const existingDoctor = await doctorRepository.findByCCCD(doctorData.cccd);
        if (existingDoctor) {
            throw new ConflictError('Doctor with this CCCD already exists');
        }

        // Check if user exists
        const existingUser = await userRepository.existsByUsername(doctorData.cccd);
        if (existingUser) {
            throw new ConflictError('User with this CCCD already exists');
        }

        // Hash password (use CCCD as default password)
        const hashedPassword = await bcrypt.hash(doctorData.cccd, PASSWORD_SALT_ROUNDS);

        // Create user
        const user = await userRepository.create({
            username: doctorData.cccd,
            password: hashedPassword,
            role: ROLES.DOCTOR
        });

        // Create doctor
        const doctor = await doctorRepository.create({
            ...doctorData,
            userId: user._id
        });

        logger.info(`Doctor created successfully: ${doctor._id}`);
        return doctor;
    }

    async getDoctors(searchTerm, specialization, page, limit) {
        const result = await doctorRepository.searchDoctors(
            searchTerm,
            specialization,
            page,
            limit
        );

        logger.info('Doctors retrieved successfully');
        return result;
    }

    async getDoctorById(doctorId) {
        const doctor = await doctorRepository.findById(doctorId);
        if (!doctor) {
            throw new NotFoundError('Doctor not found');
        }

        logger.info(`Doctor retrieved successfully: ${doctorId}`);
        return doctor;
    }

    async getDoctorByUserId(userId) {
        const doctor = await doctorRepository.findByUserId(userId);
        if (!doctor) {
            throw new NotFoundError('Doctor not found');
        }

        logger.info(`Doctor retrieved by userId: ${userId}`);
        return doctor;
    }

    async updateDoctor(doctorId, updateData) {
        const doctor = await doctorRepository.findById(doctorId);
        if (!doctor) {
            throw new NotFoundError('Doctor not found');
        }

        const updatedDoctor = await doctorRepository.updateById(doctorId, updateData);
        logger.info(`Doctor updated successfully: ${doctorId}`);
        return updatedDoctor;
    }

    async updateDoctorProfile(userId, updateData, requestUserId) {
        const doctor = await doctorRepository.findByUserId(userId);
        if (!doctor) {
            throw new NotFoundError('Doctor not found');
        }

        // Verify user is updating their own profile
        if (requestUserId !== userId) {
            throw new ForbiddenError('You can only update your own profile');
        }

        const updatedDoctor = await doctorRepository.updateById(doctor._id, updateData);
        logger.info(`Doctor profile updated successfully: ${doctor._id}`);
        return updatedDoctor;
    }

    async deleteDoctor(doctorId) {
        const doctor = await doctorRepository.findById(doctorId);
        if (!doctor) {
            throw new NotFoundError('Doctor not found');
        }

        // Delete associated devices
        await deviceRepository.deleteByDoctorId(doctor._id);

        // Delete user and doctor
        await userRepository.deleteById(doctor.userId);
        await doctorRepository.deleteById(doctor._id);

        logger.info(`Doctor deleted successfully: ${doctorId}`);
        return doctor._id;
    }

    async getDoctorsList() {
        const doctors = await doctorRepository.getDoctorsList();
        
        // Transform to include userId as _id for compatibility
        const doctorsList = doctors.map(doctor => ({
            _id: doctor.userId.toString(),
            full_name: doctor.full_name,
            email: doctor.email,
            specialization: doctor.specialization
        }));

        logger.info(`Doctors list retrieved: ${doctorsList.length} doctors`);
        return doctorsList;
    }
}

module.exports = new DoctorService();