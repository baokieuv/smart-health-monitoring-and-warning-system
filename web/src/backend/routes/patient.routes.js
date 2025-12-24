const express = require('express');
const patientController = require('../controllers/patient.controller');
const patientValidators = require('../validators/patient.validator');
const doctorValidators = require('../validators/doctor.validator');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Doctor info routes
router.get(
    '/info',
    authenticate,
    authorizeRoles(ROLES.DOCTOR),
    validateRequest,
    patientController.getDoctorInfo
);

router.put(
    '/info',
    authenticate,
    authorizeRoles(ROLES.DOCTOR),
    doctorValidators.updateDoctorProfile,
    validateRequest,
    patientController.updateDoctorInfo
);

// Patient management routes
router.post(
    '/patients',
    authenticate,
    authorizeRoles(ROLES.DOCTOR),
    patientValidators.createPatient,
    validateRequest,
    patientController.createPatient
);

router.get(                 // NEED CHECK
    '/doctors-list',
    authenticate,
    authorizeRoles(ROLES.DOCTOR),
    validateRequest,
    patientController.getDoctorsList
);

router.get(
    '/patients',
    authenticate,
    authorizeRoles(ROLES.DOCTOR),
    patientValidators.getPatients,
    validateRequest,
    patientController.getPatients
);

router.get(
    '/patients/:patient_id',
    authenticate,
    authorizeRoles(ROLES.DOCTOR),
    patientValidators.getPatientById,
    validateRequest,
    patientController.getPatientDetail
);

router.put(
    '/patients/:patient_id',
    authenticate,
    authorizeRoles(ROLES.DOCTOR),
    patientValidators.updatePatient,
    validateRequest,
    patientController.updatePatient
);

router.get(
    '/patients/:patient_id/health',
    authenticate,
    authorizeRoles(ROLES.DOCTOR),
    patientValidators.patientHealthOperations,
    validateRequest,
    patientController.getHealthInfo
);

router.delete(
    '/patients/:patient_id',
    authenticate,
    authorizeRoles(ROLES.DOCTOR),
    patientValidators.getPatientById,
    validateRequest,
    patientController.deletePatient
);

router.post(                    // NEED CHECK
    '/patients/:patient_id/allocate-device',
    authenticate,
    authorizeRoles(ROLES.DOCTOR),
    patientValidators.patientHealthOperations,
    validateRequest,
    patientController.allocateDevice
);

router.post(                    // NEED CHECK
    '/patients/:patient_id/recall-device',
    authenticate,
    authorizeRoles(ROLES.DOCTOR),
    patientValidators.patientHealthOperations,
    validateRequest,
    patientController.recallDevice
);

module.exports = router;