const doctorService = require('../services/doctor.service');
const deviceService = require('../services/device.service');
const ResponseUtil = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler.util');
const validator = require('../utils/validator.util');
const { PAGINATION } = require('../config/constants');

class DoctorController {
    createDoctor = asyncHandler(async (req, res) => {
        const doctorData = {
            cccd: validator.sanitizeInput(req.body.cccd),
            full_name: validator.sanitizeInput(req.body.full_name),
            email: validator.sanitizeInput(req.body.email),
            birthday: req.body.birthday,
            address: validator.sanitizeInput(req.body.address),
            phone: validator.sanitizeInput(req.body.phone),
            specialization: validator.sanitizeInput(req.body.specialization)
        };

        const doctor = await doctorService.createDoctor(doctorData);
        
        ResponseUtil.created(res, { doctor }, 'Doctor created successfully');
    });

    getDoctors = asyncHandler(async (req, res) => {
        const { 
            page = PAGINATION.DEFAULT_PAGE, 
            limit = PAGINATION.DEFAULT_LIMIT, 
            search = '', 
            specialization = '' 
        } = req.query;

        const result = await doctorService.getDoctors(
            search,
            specialization,
            parseInt(page),
            parseInt(limit)
        );

        ResponseUtil.paginate(
            res,
            result.data,
            result.page,
            result.limit,
            result.total,
            'Doctors retrieved successfully'
        );
    });

    getDoctorByUserId = asyncHandler(async (req, res) => {
        const doctor = await doctorService.getDoctorByUserId(req.params.user_id);
        
        ResponseUtil.success(res, { doctor }, 'Doctor retrieved successfully');
    });

    getDoctorDetail = asyncHandler(async (req, res) => {
        const doctor = await doctorService.getDoctorById(req.params.doctor_id);
        
        ResponseUtil.success(res, { doctor }, 'Doctor retrieved successfully');
    });

    updateDoctor = asyncHandler(async (req, res) => {
        const updateFields = ['full_name', 'email', 'birthday', 'address', 'phone', 'specialization'];
        const updateData = {};

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = field === 'birthday' 
                    ? req.body[field] 
                    : validator.sanitizeInput(req.body[field]);
            }
        });

        const doctor = await doctorService.updateDoctor(req.params.doctor_id, updateData);
        
        ResponseUtil.success(res, { doctor }, 'Doctor information updated successfully');
    });

    updateDoctorProfile = asyncHandler(async (req, res) => {
        const updateFields = ['full_name', 'email', 'birthday', 'address', 'phone', 'specialization'];
        const updateData = {};

        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = field === 'birthday' 
                    ? req.body[field] 
                    : validator.sanitizeInput(req.body[field]);
            }
        });

        const doctor = await doctorService.updateDoctorProfile(
            req.params.user_id,
            updateData,
            req.user.id
        );
        
        ResponseUtil.success(res, { doctor }, 'Profile updated successfully');
    });

    deleteDoctor = asyncHandler(async (req, res) => {
        const deletedId = await doctorService.deleteDoctor(req.params.doctor_id);
        
        ResponseUtil.success(res, { deleted_doctor_id: deletedId }, 'Doctor deleted successfully');
    });

    getDevices = asyncHandler(async (req, res) => {
        const { 
            page = PAGINATION.DEFAULT_PAGE, 
            limit = PAGINATION.DEFAULT_LIMIT 
        } = req.query;

        const result = await deviceService.getDevices(
            parseInt(page),
            parseInt(limit)
        );

        ResponseUtil.paginate(
            res,
            result.data,
            result.page,
            result.limit,
            result.total,
            'Devices retrieved successfully'
        );
    });
}

module.exports = new DoctorController();