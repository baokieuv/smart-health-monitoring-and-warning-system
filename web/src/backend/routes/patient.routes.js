const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const patientController = require('../controllers/patient.controller');
const { validateCCCD, validatePhone, validateDate } = require('../utils/validator');

const router = express.Router();

// 8. Create Patient API
router.post(
    '/',
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

// 9. Get Patient List API
router.get(
    '/',
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

// 10. Get Patient Detail API
router.get(
    '/:patient_id',
    authenticate,
    authorizeRoles('doctor'),
    [
        param('patient_id')
            .isMongoId().withMessage('Invalid Patient ID')
    ],
    validateRequest,
    patientController.getPatientDetail
);

// 11. Update Patient API
router.put(
    '/:patient_id',
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

// 12. Get Patient Health Info API
router.get( 
    '/:patient_id/health',
    authenticate,
    authorizeRoles('doctor'),
    [
        param('patient_id')
            .isMongoId().withMessage('Invalid Patient ID')
    ],
    validateRequest,
    patientController.getHealthInfo
);

// 13. Delete Patient API
router.delete(
    '/:patient_id',
    authenticate,
    authorizeRoles('doctor'),
    [
        param('patient_id')
            .isMongoId().withMessage('Invalid Patient ID')
    ],
    validateRequest,
    patientController.deletePatient
);

module.exports = router;