const express = require("express");
const { body } = require('express-validator');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const familyController = require('../controllers/family.controller');

const router = express.Router();

router.post(
    '/access/auth',
    [
        body('cccd').notEmpty().isLength({ min: 12, max: 12 }).withMessage('CCCD must be 12 digits'),
        body('secretCode').notEmpty().isLength({ min: 10, max: 10 }).withMessage('Secret code must be 10 digits')
    ],
    validateRequest,
    familyController.authenticateFamilyAccess
);

module.exports = router;
