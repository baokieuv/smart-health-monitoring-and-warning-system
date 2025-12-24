const { body, param, query } = require('express-validator');
const validator = require('../utils/validator.util');

const commonValidators = {
    cccd: body('cccd')
        .notEmpty().withMessage('CCCD is required')
        .custom(validator.validateCCCD).withMessage('Invalid CCCD format'),
    
    phone: body('phone')
        .notEmpty().withMessage('Phone is required')
        .custom(validator.validatePhone).withMessage('Invalid phone format'),
    
    email: body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format'),
    
    date: body('birthday')
        .notEmpty().withMessage('Birthday is required')
        .custom(validator.validateDate).withMessage('Invalid date format (YYYY-MM-DD)'),
    
    fullName: body('full_name')
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Full name must be between 2-100 characters'),
    
    address: body('address')
        .notEmpty().withMessage('Address is required')
        .isLength({ min: 5, max: 200 }).withMessage('Address must be between 5-200 characters'),
    
    mongoId: (paramName = 'id') => param(paramName)
        .isMongoId().withMessage(`Invalid ${paramName}`),
    
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100')
    ]
};

module.exports = commonValidators;