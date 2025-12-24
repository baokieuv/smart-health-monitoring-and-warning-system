const express = require('express');
const doctorController = require('../controllers/doctor.controller');
const doctorValidators = require('../validators/doctor.validator');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

// Admin routes
router.post(
    '/doctors',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    doctorValidators.createDoctor,
    validateRequest,
    doctorController.createDoctor
);

router.get(
    '/doctors',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    doctorValidators.getDoctors,
    validateRequest,
    doctorController.getDoctors
);

router.get(
    '/doctors/:doctor_id',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    doctorValidators.getDoctorById,
    validateRequest,
    doctorController.getDoctorDetail
);

router.put(
    '/doctors/:doctor_id',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    doctorValidators.updateDoctor,
    validateRequest,
    doctorController.updateDoctor
);

router.delete(
    '/doctors/:doctor_id',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    doctorValidators.getDoctorById,
    validateRequest,
    doctorController.deleteDoctor
);


router.get(
    '/devices',
    authenticate,
    authorizeRoles(ROLES.ADMIN),
    validateRequest,
    doctorController.getDevices
);

// =============== NEED CHECK =============================

// Doctor profile routes
router.get(
    '/user/:user_id',
    authenticate,
    doctorValidators.getDoctorByUserId,
    validateRequest,
    doctorController.getDoctorByUserId
);

router.put(
    '/user/:user_id/profile',
    authenticate,
    authorizeRoles(ROLES.DOCTOR),
    doctorValidators.updateDoctorProfile,
    validateRequest,
    doctorController.updateDoctorProfile
);

module.exports = router;