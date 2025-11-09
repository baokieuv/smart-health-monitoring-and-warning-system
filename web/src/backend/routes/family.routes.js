const express = require("express");
const router = express.Router();
const patientController = require("../controllers/patient.controller");

// GET /api/patients/:patient_id/info
router.get("/:patient_id/info", patientController.getPatientInfo);

// GET /api/patients/:patient_id/health
router.get("/:patient_id/health", patientController.getPatientHealth);

module.exports = router;
