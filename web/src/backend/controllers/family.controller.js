const patients = require("../data/patients");
const { sanitizeInput } = require("../utils/validator");
const tokenStore = require("../utils/token-store");

const THINGSBOARD_URL = "http://localhost:8080";

// 1) Lấy thông tin cá nhân bệnh nhân
exports.getPatientInfo = (req, res) => {
  try {
    const patientId = parseInt(req.params.patient_id, 10);

    if (Number.isNaN(patientId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid patient_id. It must be a number.",
      });
    }

    const patient = patients.find((p) => p.id === patientId);
    if (!patient) {
      return res.status(404).json({
        status: "error",
        message: "Patient not found.",
      });
    }

    const { heart_rate, temperature, ...personalInfo } = patient;

    return res.status(200).json({
      status: "success",
      message: "Patient info retrieved successfully.",
      data: personalInfo,
    });
  } catch (error) {
    console.error("Get patient info error:", error);
    return res.status(500).json({
      status: "error",
      message: "Unexpected error occurred.",
    });
  }
};

// 2) Lấy thông tin sức khỏe bệnh nhân
// 2) Lấy thông tin sức khỏe bệnh nhân (tạm trả về dữ liệu fix)
exports.getPatientHealth = (req, res) => {
  try {
    const patientId = parseInt(req.params.patient_id, 10);

    if (Number.isNaN(patientId)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid patient_id. It must be a number.",
      });
    }

    const patient = patients.find((p) => p.id === patientId);
    if (!patient) {
      return res.status(404).json({
        status: "error",
        message: "Patient not found.",
      });
    }

    // DỮ LIỆU FIX TẠM
    const health = {
      heart_rate: 78,
      temperature: 37.2,
      ts: new Date().toISOString(),
      source: "mock",
    };

    return res.status(200).json({
      status: "success",
      message: "Patient health retrieved successfully.",
      data: health,
    });
  } catch (error) {
    console.error("Get patient health error:", error);
    return res.status(500).json({
      status: "error",
      message: "Unexpected error occurred.",
    });
  }
};
