const { body } = require('express-validator');

const authValidators = {
    login: [
        body('username')
            .notEmpty().withMessage('Username is required')
            .trim(),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 4 }).withMessage('Password must be at least 4 characters')
    ],

    refreshToken: [
        body('refresh_token')
            .notEmpty().withMessage('Refresh token is required')
    ],

    logout: [
        body('refresh_token')
            .optional()
            .isString().withMessage('Refresh token must be a string')
    ],

    changePassword: [
        body('username')
            .notEmpty().withMessage('Username is required')
            .trim(),
        body('oldPassword')
            .notEmpty().withMessage('Old password is required'),
        body('newPassword')
            .notEmpty().withMessage('New password is required')
            .isLength({ min: 4 }).withMessage('New password must be at least 4 characters')
    ]
};

module.exports = authValidators;