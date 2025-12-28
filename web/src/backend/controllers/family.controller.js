const { sanitizeInput } = require("../utils/validator");
const tokenStore = require("../utils/token-store");
const Patient = require("../models/patient.model");
const { generateTokens } = require('../utils/token');

const THINGSBOARD_URL = "http://localhost:8080";

/**
 * Family Access Authentication
 * Allows family members to login using CCCD + phone number
 * Returns JWT tokens with role='patient'
 */
exports.authenticateFamilyAccess = async (req, res) => {
	try {
		const cccd = sanitizeInput(req.body.cccd);
		const secretCode = sanitizeInput(req.body.secretCode);

		// Find patient by CCCD
		const patient = await Patient.findOne({ cccd: cccd }).populate('doctorId');

		if (!patient) {
			return res.status(404).json({
				status: 'error',
				message: 'Không tìm thấy bệnh nhân với CCCD này'
			});
		}

		// Verify secret code (phone number)
		const normalizedSecretCode = secretCode.replace(/^0/, '');
		const normalizedPatientPhone = patient.phone.replace(/^0/, '');

		if (normalizedSecretCode !== normalizedPatientPhone) {
			return res.status(401).json({
				status: 'error',
				message: 'Mã bí mật không đúng'
			});
		}

		// Create a pseudo-user object for JWT generation
		const pseudoUser = {
			_id: patient._id,
			username: patient.cccd,
			role: 'patient'
		};

		// Generate JWT tokens (same as login)
		const tokens = generateTokens(pseudoUser);
		tokenStore.saveRefreshToken(tokens.refreshTokenId, patient._id, tokens.refreshTokenExpiresAt);

		// Try to connect to ThingsBoard (optional)
		try {
			const resp = await fetch(`${THINGSBOARD_URL}/api/auth/login`, {
				method: "POST",
				body: JSON.stringify({ username: "tenant@thingsboard.org", password: "tenant" }),
				headers: { "Content-Type": "application/json" }
			});

			if(resp.ok){
				const json = await resp.json();
				tokenStore.saveThingsBoardToken(patient._id.toString(), json.token, tokens.refreshTokenExpiresAt);
				console.log("ThingsBoard login successful for patient: ", patient._id);
			}
		} catch (err) {
			console.warn("ThingsBoard connection failed: ", err.message);
		}

		console.log(`✅ Family access granted for patient: ${patient.full_name} (${patient.cccd})`);

		return res.status(200).json({
			status: 'success',
			message: 'Xác thực thành công',
			data: {
				user: {
					id: patient._id,
					username: patient.cccd,
					role: 'patient'
				},
				patientId: patient._id,
				patientName: patient.full_name,
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken
			}
		});
	} catch (err) {
		console.error('Family auth error:', err);
		return res.status(500).json({
			status: 'error',
			message: 'Lỗi hệ thống'
		});
	}
};
