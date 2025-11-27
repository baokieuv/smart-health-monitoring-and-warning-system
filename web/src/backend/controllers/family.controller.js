const { sanitizeInput } = require("../utils/validator");
const tokenStore = require("../utils/token-store");
const Patient = require("../models/patient.model");

const THINGSBOARD_URL = "http://localhost:8080";

exports.getDetail = async (req, res) => {
	try{
		const patient = await Patient.findOne({userId: req.user._id});

		if(!patient){
			return res.status(404).json({
				status: 'error',
				message: 'User not found.'
			});
		}

		return res.status(200).json({
			status: 'success',
			message: 'User retrieved successfully.',
			data: patient
		});
	}catch(err){
		console.error('Create patient error:', err);
		return res.status(500).json({
			status: "error",
			message: "Unexpected error occurred."
		});
	}
}

// 1) Lấy thông tin cá nhân bệnh nhân
exports.getPatientDetail = async (req, res) => {
	try {
		// const patient = await Patient.findById(req.params.patient_id);
		const patient = await Patient.findOne({ userId: req.user.id });
		if (!patient) {
			return res.status(404).json({
				status: "error",
				message: "Patient not found.",
			});
		}

		return res.status(200).json({
			status: "success",
			message: "Patient info retrieved successfully.",
			patient: patient,
		});
	} catch (err) {
		console.error("Get patient info error:", err);
		return res.status(500).json({
			status: "error",
			message: "Unexpected error occurred.",
		});
	}
};

// 2) Lấy thông tin sức khỏe bệnh nhân
exports.getPatientHealth = async (req, res) => {
	try {
		const patient = await Patient.findOne({ userId: req.user.id });
		if (!patient) {
			return res.status(404).json({
				status: "error",
				message: "Patient not found.",
			});
		}

		if (!patient.deviceId) {
			return res.status(404).json({
				status: "error",
				message: "Device not found for this patient on ThingsBoard.",
			});
		}

		const token = tokenStore.findThingsBoardToken(req.user.id);
		if (!token) {
			return res.status(503).json({
				status: "error",
				message: "ThingsBoard connection not available.",
			});
		}

		const response = await fetch(`${THINGSBOARD_URL}/api/plugins/telemetry/DEVICE/${patient.deviceId}/values/timeseries?keys=heart_rate,SpO2,temperature,alarm`, {
			method: "GET",
			headers: {
				"X-Authorization": `Bearer ${token}`,
			},
		}
		);

		if (!response.ok) {
			throw new Error(`ThingsBoard telemetry fetch failed: ${response.status}`);
		}

		const telemetryData = await response.json();

		const healthInfo = Object.fromEntries(
			Object.entries(telemetryData).map(([key, values]) => {
				const latest =
					Array.isArray(values) && values.length > 0
						? values[values.length - 1].value
						: null;
				return [key, latest];
			})
		);

		const payload = {
			heart_rate: healthInfo.heart_rate
				? parseFloat(healthInfo.heart_rate)
				: null,
			SpO2: healthInfo.SpO2 ? parseFloat(healthInfo.SpO2) : null,
			temperature: healthInfo.temperature
				? parseFloat(healthInfo.temperature)
				: null,
			last_measurement: new Date().toISOString(),
			alarm_status: healthInfo.alarm || null,
		};

		return res.status(200).json({
			status: "success",
			patient_id: patient._id,
			health_info: payload,
		});
	} catch (err) {
		console.error("Get patient health error:", err);
		return res.status(500).json({
			status: "error",
			message: "Unexpected error occurred.",
		});
	}
};
