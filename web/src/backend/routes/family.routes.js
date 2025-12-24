const express = require('express');
const familyController = require('../controllers/family.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get(
    '/info',
    authenticate,
    authorizeRoles(ROLES.PATIENT),
    validateRequest,
    familyController.getPatientInfo
);

router.get(             // NEED CHECK
    '/health',
    authenticate,
    authorizeRoles(ROLES.PATIENT),
    validateRequest,
    familyController.getPatientHealth
);

module.exports = router;