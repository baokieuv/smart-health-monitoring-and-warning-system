const patientService = require('../services/patient.service');
const doctorService = require('../services/doctor.service');
const ResponseUtil = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler.util');
const validator = require('../utils/validator.util');
const { PAGINATION } = require('../config/constants');

class PatientController {
    getDoctorInfo = asyncHandler(async (req, res) => {
        const doctor = await doctorService.getDoctorByUserId(req.user.id);
        
        ResponseUtil.success(res, doctor, 'Doctor information retrieved successfully');
    });

    updateDoctorInfo = asyncHandler(async (req, res) => {
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
            req.user.id,
            updateData,
            req.user.id
        );
        
        ResponseUtil.success(res, { doctor }, 'Doctor information updated successfully');
    });

    createPatient = asyncHandler(async (req, res) => {
        const patientData = {
            cccd: validator.sanitizeInput(req.body.cccd),
            full_name: validator.sanitizeInput(req.body.full_name),
            birthday: req.body.birthday,
            address: validator.sanitizeInput(req.body.address),
            phone: validator.sanitizeInput(req.body.phone),
            room: validator.sanitizeInput(req.body.room),
            doctorId: req.body.doctorId
        };

        const patient = await patientService.createPatient(patientData);
        
        ResponseUtil.created(res, { patient }, 'Patient created successfully');
    });

    getDoctorsList = asyncHandler(async (req, res) => {
        const doctors = await doctorService.getDoctorsList();
        
        ResponseUtil.success(res, { doctors }, 'Doctors list retrieved successfully');
    });

    getPatients = asyncHandler(async (req, res) => {
        const { 
            page = PAGINATION.DEFAULT_PAGE, 
            limit = PAGINATION.DEFAULT_LIMIT, 
            search = ''
        } = req.query;

        const result = await patientService.getPatients(
            {
                doctorId: req.user.id,
                search
            },
            parseInt(page),
            parseInt(limit)
        );

        ResponseUtil.paginate(
            res,
            result.data,
            result.page,
            result.limit,
            result.total,
            'Patients retrieved successfully'
        );
    });

    getPatientDetail = asyncHandler(async (req, res) => {
        console.log(req.user);
        const patient = await patientService.getPatientById(req.params.patient_id, req.user.id);
        
        ResponseUtil.success(res, { patient }, 'Patient retrieved successfully');
    });

    updatePatient = asyncHandler(async (req, res) => {
        const allowedFields = ['full_name', 'birthday', 'address', 'phone', 'room', 'doctorId'];
        const updateData = {};

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'birthday' || field === 'doctorId') {
                    updateData[field] = req.body[field];
                } else {
                    updateData[field] = validator.sanitizeInput(req.body[field]);
                }
            }
        });

        const patient = await patientService.updatePatient(req.params.patient_id, updateData, req.user.id);
        
        ResponseUtil.success(res, { patient }, 'Patient information updated successfully');
    });

    getHealthInfo = asyncHandler(async (req, res) => {
        const result = await patientService.getHealthInfo(req.params.patient_id, req.user.id, req.user.id);
        
        ResponseUtil.success(res, result, 'Patient health info retrieved successfully');
    });

    deletePatient = asyncHandler(async (req, res) => {
        const deletedId = await patientService.deletePatient(req.params.patient_id, req.user.id);
        
        ResponseUtil.success(res, { deleted_patient_id: deletedId }, 'Patient deleted successfully');
    });

    allocateDevice = asyncHandler(async (req, res) => {
        const deviceId = await patientService.allocateDevice(req.params.patient_id, req.user.id);
        
        ResponseUtil.success(res, { device_id: deviceId }, 'Device allocated successfully');
    });

    recallDevice = asyncHandler(async (req, res) => {
        const deviceId = await patientService.recallDevice(req.params.patient_id, req.user.id);
        
        ResponseUtil.success(res, { device_id: deviceId }, 'Device recalled successfully');
    });
}

module.exports = new PatientController();