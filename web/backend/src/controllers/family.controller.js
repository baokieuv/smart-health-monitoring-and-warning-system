const patientService = require('../services/patient.service');
const ResponseUtil = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler.util');

class FamilyController {
    getPatientInfo = asyncHandler(async (req, res) => {
        const patient = await patientService.getPatientByUserId(req.user.id);
        
        ResponseUtil.success(res, { patient }, 'Patient info retrieved successfully');
    });

    getPatientHealth = asyncHandler(async (req, res) => {
        const patient = await patientService.getPatientByUserId(req.user.id);
        const result = await patientService.getHealthInfo(patient._id, req.user.id);
        
        ResponseUtil.success(res, result, 'Patient health info retrieved successfully');
    });

    authenticateFamilyAccess = asyncHandler(async (req, res) => {
        const result = await patientService.authenticateFamilyAccess(req.body.cccd, req.body.secretCode);

        ResponseUtil.success(res, { result }, 'Login successfully');
    });
}

module.exports = new FamilyController();