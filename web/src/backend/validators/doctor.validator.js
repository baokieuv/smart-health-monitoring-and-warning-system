const { body, query } = require('express-validator');
const commonValidators = require('./common.validator');

const doctorValidators = {
    createDoctor: [
        commonValidators.cccd,
        commonValidators.fullName,
        commonValidators.email,
        commonValidators.date,
        commonValidators.address,
        commonValidators.phone,
        body('specialization')
            .notEmpty().withMessage('Specialization is required')
            .isLength({ min: 2, max: 100 }).withMessage('Specialization must be between 2-100 characters')
    ],

    updateDoctor: [
        commonValidators.mongoId('doctor_id'),
        body('full_name')
            .optional()
            .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2-100 characters'),
        body('email')
            .optional()
            .isEmail().withMessage('Invalid email format'),
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
        body('specialization')
            .optional()
            .isLength({ min: 2, max: 100 }).withMessage('Specialization must be between 2-100 characters')
    ],

    getDoctors: [
        ...commonValidators.pagination,
        query('search')
            .optional()
            .isString().withMessage('Search must be a string'),
        query('specialization')
            .optional()
            .isString().withMessage('Specialization must be a string')
    ],

    getDoctorById: [
        commonValidators.mongoId('doctor_id')
    ],

    getDoctorByUserId: [
        commonValidators.mongoId('user_id')
    ],

    updateDoctorProfile: [
        commonValidators.mongoId('user_id'),
        body('full_name')
            .optional()
            .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2-100 characters'),
        body('email')
            .optional()
            .isEmail().withMessage('Invalid email format'),
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
        body('specialization')
            .optional()
            .isLength({ min: 2, max: 100 }).withMessage('Specialization must be between 2-100 characters')
    ]
};

module.exports = doctorValidators;