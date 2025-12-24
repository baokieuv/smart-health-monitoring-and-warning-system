const { body, query } = require('express-validator');
const commonValidators = require('./common.validator');

const patientValidators = {
    createPatient: [
        commonValidators.cccd,
        commonValidators.fullName,
        commonValidators.date,
        commonValidators.address,
        commonValidators.phone,
        body('room')
            .notEmpty().withMessage('Room is required')
            .isLength({ min: 1, max: 50 }).withMessage('Room must be between 1-50 characters'),
        body('doctorId')
            .notEmpty().withMessage('Doctor ID is required')
            .isMongoId().withMessage('Invalid Doctor ID')
    ],

    updatePatient: [
        commonValidators.mongoId('patient_id'),
        body('full_name')
            .optional()
            .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2-100 characters'),
        body('birthday')
            .optional()
            .custom(require('../utils/validator.util').validateDate)
            .withMessage('Invalid date format (YYYY-MM-DD)'),
        body('address')
            .optional()
            .isLength({ min: 5, max: 200 }).withMessage('Address must be between 5-200 characters'),
        body('phone')
            .optional()
            .custom(require('../utils/validator.util').validatePhone)
            .withMessage('Invalid phone format'),
        body('room')
            .optional()
            .isLength({ min: 1, max: 50 }).withMessage('Room must be between 1-50 characters'),
        body('doctorId')
            .optional()
            .isMongoId().withMessage('Invalid Doctor ID')
    ],

    getPatients: [
        ...commonValidators.pagination,
        query('search')
            .optional()
            .isString().withMessage('Search must be a string')
    ],

    getPatientById: [
        commonValidators.mongoId('patient_id')
    ],

    patientHealthOperations: [
        commonValidators.mongoId('patient_id')
    ]
};

module.exports = patientValidators;