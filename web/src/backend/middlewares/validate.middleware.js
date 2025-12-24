const { validationResult } = require('express-validator');
const { ValidationError } = require('../errors');

const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(err => ({
            field: err.path || err.param,
            message: err.msg
        }));
        
        throw new ValidationError('Validation failed', formattedErrors);
    }
    
    next();
};

module.exports = { validateRequest };