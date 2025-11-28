const express = require("express");
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const familyController = require('../controllers/family.controller');

const router = express.Router();

// get current patient's details
router.get(
    "/info", 
    authenticate,
    authorizeRoles('patient'),
    validateRequest,
    familyController.getPatientDetail);

// get current patient's health info
router.get(
    "/health", 
    authenticate,
    authorizeRoles('patient'),
    validateRequest,
    familyController.getPatientHealth);

module.exports = router;
