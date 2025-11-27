const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const patientController = require('../controllers/patient.controller');
const { validateCCCD, validatePhone, validateDate } = require('../utils/validator');

const router = express.Router();

// get current doctor details API
router.get(
    '/info',
    authenticate,
    authorizeRoles('doctor'),
    validateRequest,
    patientController.getDetail
);

// update current doctor details API
router.put(
    '/info',
    authenticate,
    authorizeRoles('doctor'),
    [
		body('full_name')
			.optional()
			.isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2-100 characters'),
		body('email')
			.optional()
			.isEmail().withMessage('Invalid email format'),
		body('birthday')
			.optional()
			.custom(validateDate).withMessage('Invalid date format (YYYY-MM-DD)'),
		body('address')
			.optional()
			.isLength({ min: 5, max: 200 }).withMessage('Address must be between 5-200 characters'),
		body('phone')
			.optional()
			.custom(validatePhone).withMessage('Invalid phone format'),
		body('specialization')
			.optional()
			.isLength({ min: 2, max: 100 }).withMessage('Specialization must be between 2-100 characters')
	],
    validateRequest,
    patientController.updateDetail
);

// create a new patient API
router.post(
    '/patients',
    authenticate,
    authorizeRoles('doctor'),
    [
        body('cccd')
            .notEmpty().withMessage('CCCD is required')
            .custom(validateCCCD).withMessage('Invalid CCCD format'),
        body('full_name')
            .notEmpty().withMessage('Full name is required')
            .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2-100 characters'),
        body('birthday')
            .notEmpty().withMessage('Birthday is required')
            .custom(validateDate).withMessage('Invalid date format (YYYY-MM-DD)'),
        body('address')
            .notEmpty().withMessage('Address is required')
            .isLength({ min: 5, max: 200 }).withMessage('Address must be between 5-200 characters'),
        body('phone')
            .notEmpty().withMessage('Phone is required')
            .custom(validatePhone).withMessage('Invalid phone format'),
        body('room')
            .notEmpty().withMessage('Room is required')
            .isLength({ min: 1, max: 50 }).withMessage('Room must be between 1-50 characters')
    ],
    validateRequest,
    patientController.createPatient
);

// get patient list API
router.get(
    '/patients',
    authenticate,
    authorizeRoles('doctor'),
    [
        query('page')
            .optional()
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
        query('search')
            .optional()
            .isString().withMessage('Search must be a string')
    ],
    validateRequest,
    patientController.getPatients
);

// get patient detail API
router.get(
    '/patients/:patient_id',
    authenticate,
    authorizeRoles('doctor'),
    [
        param('patient_id')
            .isMongoId().withMessage('Invalid Patient ID')
    ],
    validateRequest,
    patientController.getPatientDetail
);

// update patient API
router.put(
    '/patients/:patient_id',
    authenticate,
    authorizeRoles('doctor'),
    [
        param('patient_id')
            .isMongoId().withMessage('Invalid Patient ID'),
        body('full_name')
            .optional()
            .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2-100 characters'),
        body('birthday')
            .optional()
            .custom(validateDate).withMessage('Invalid date format (YYYY-MM-DD)'),
        body('address')
            .optional()
            .isLength({ min: 5, max: 200 }).withMessage('Address must be between 5-200 characters'),
        body('phone')
            .optional()
            .custom(validatePhone).withMessage('Invalid phone format'),
        body('room')
            .optional()
            .isLength({ min: 1, max: 50 }).withMessage('Room must be between 1-50 characters')
    ],
    validateRequest,
    patientController.updatePatient
);

// get patient health info API
router.get( 
    '/patients/:patient_id/health',
    authenticate,
    authorizeRoles('doctor'),
    [
        param('patient_id')
            .isMongoId().withMessage('Invalid Patient ID')
    ],
    validateRequest,
    patientController.getHealthInfo
);

// delete patient API
router.delete(
    '/patients/:patient_id',
    authenticate,
    authorizeRoles('doctor'),
    [
        param('patient_id')
            .isMongoId().withMessage('Invalid Patient ID')
    ],
    validateRequest,
    patientController.deletePatient
);

// allocate device for patient API
router.post(
    '/patients/:patient_id/allocate-device',
    authenticate,
    authorizeRoles('doctor'),
    [
        param('patient_id')
            .isMongoId().withMessage('Invalid Patient ID')
    ],
    validateRequest,
    patientController.allocateDevice
);

// recall device from patient API
router.post(
    '/patients/:patient_id/recall-device',
    authenticate,
    authorizeRoles('doctor'),
    [
        param('patient_id')
            .isMongoId().withMessage('Invalid Patient ID')
    ],
    validateRequest,
    patientController.recallDevice
);

module.exports = router;