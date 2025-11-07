const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const doctorController = require('../controllers/doctor.controller');
const { validateCCCD, validatePhone, validateDate } = require('../utils/validator');

const router = express.Router();

// 3. Create Doctor API
router.post(
	'/',
	authenticate,
	authorizeRoles('admin'),
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
		body('specialization')
			.notEmpty().withMessage('Specialization is required')
			.isLength({ min: 2, max: 100 }).withMessage('Specialization must be between 2-100 characters')
	],
	validateRequest,
	doctorController.createDoctor
);

// 4. Get Doctor List API
router.get(
	'/',
	authenticate,
	authorizeRoles('admin'),
	[
		query('page')
			.optional()
			.isInt({ min: 1 }).withMessage('Page must be a positive integer'),
		query('limit')
			.optional()
			.isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1-100'),
		query('search')
			.optional()
			.isString().withMessage('Search must be a string'),
		query('specialization')
			.optional()
			.isString().withMessage('Specialization must be a string')
	],
	validateRequest,
	doctorController.getDoctors
);

// 5. Get Doctor Detail API
router.get(
	'/:doctor_id',
	authenticate,
	authorizeRoles('admin'),
	[
		param('doctor_id')
			.isInt({ min: 1 }).withMessage('Doctor ID must be a positive integer')
	],
	validateRequest,
	doctorController.getDoctorDetail
);

// 6. Update Doctor API
router.put(
	'/:doctor_id',
	authenticate,
	authorizeRoles('admin'),
	[
		param('doctor_id')
			.isInt({ min: 1 }).withMessage('Doctor ID must be a positive integer'),
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
		body('specialization')
			.notEmpty().withMessage('Specialization is required')
			.isLength({ min: 2, max: 100 }).withMessage('Specialization must be between 2-100 characters')
	],
	validateRequest,
	doctorController.updateDoctor
);

// 7. Delete Doctor API
router.delete(
	'/:doctor_id',
	authenticate,
	authorizeRoles('admin'),
	[
		param('doctor_id')
			.isInt({ min: 1 }).withMessage('Doctor ID must be a positive integer')
	],
	validateRequest,
	doctorController.deleteDoctor
);

module.exports = router;
