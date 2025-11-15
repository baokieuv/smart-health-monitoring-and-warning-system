const express = require("express");
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const familyController = require('../controllers/family.controller');

const router = express.Router();

// GET /api/v1/family/info
router.get(
    "/info", 
    authenticate,
    authorizeRoles('patient'),
    validateRequest,
    familyController.getPatientDetail);

// GET /api/v1/family//health
router.get(
    "/health", 
    authenticate,
    authorizeRoles('patient'),
    validateRequest,
    familyController.getPatientHealth);

module.exports = router;
