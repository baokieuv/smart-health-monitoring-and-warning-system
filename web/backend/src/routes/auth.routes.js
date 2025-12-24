const express = require('express');
const authController = require('../controllers/auth.controller');
const authValidators = require('../validators/auth.validator');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');

const router = express.Router();

router.post('/login', authLimiter, authValidators.login, validateRequest, authController.login);
router.post('/refresh', authValidators.refreshToken, validateRequest, authController.refreshToken);
router.post('/logout', authenticate, authValidators.logout, validateRequest, authController.logout);
router.post('/change-password', authValidators.changePassword, validateRequest, authController.changePassword);

module.exports = router;