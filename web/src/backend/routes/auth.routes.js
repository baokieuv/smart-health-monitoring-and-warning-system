const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');

const router = express.Router();

// login API
router.post(
	'/login',
	[
		body('username').notEmpty().withMessage('Username is required'),
		body('password').notEmpty().isLength({ min: 4 }).withMessage('Password is required')
	],
	validateRequest,
	authController.login
);

// refresh token API
router.post(
	'/refresh',
	[
		body('refresh_token').notEmpty().withMessage('Refresh token is required')
	],
	validateRequest,
	authController.refreshToken
);

// logout API
router.post(
	'/logout',
	authenticate,
	[
		body('refresh_token').optional().isString().withMessage('Refresh token must be a string')
	],
	validateRequest,
	authController.logout
);

// change password API
router.post(
	'/change-password',
	[
		body('username').notEmpty().withMessage('Username is required'),
		body('oldPassword').notEmpty().withMessage('Old password is required'),
		body('newPassword').notEmpty().withMessage('New password is required')
	],
	validateRequest,
	authController.changePassword	
);

module.exports = router;
