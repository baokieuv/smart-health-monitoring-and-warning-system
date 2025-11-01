const patients = require('../data/patients')
const { sanitizeInput } = require('../utils/validator')

// 8. Create Patient API
exports.createPatient = (req, res) => {
    try {
        const patientData = {
            cccd: sanitizeInput(req.body.cccd),
            full_name: sanitizeInput(req.body.full_name),
            birthday: req.body.birthday,
            address: sanitizeInput(req.body.address),
            phone: sanitizeInput(req.body.phone),
            room: sanitizeInput(req.body.room),
            doctor_id: 1
        };

        // Check duplicate CCCD
        const existingPatient = patients.find(p => p.cccd === patientData.cccd);
        if (existingPatient) {
            return res.status(409).json({
                status: "error",
                message: "User already exists."
            });
        }

        //New ID
        const newId = patients.length > 0 ? Math.max(...patients.map(p => p.id)) + 1 : 1;
        const newPatient = { id: newId, ...patientData };
        
        //Add new patient
        patients.push(newPatient);

        res.status(201).json({
            status: "success",
            message: "Patient created successfully.",
            patient: newPatient
        });
    } catch (error) {
        console.error('Create patient error:', error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error occurred."
        });
    }
}

// 9. Get Patient List API

exports.getPatients = (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;

        // Filter patients by doctor
        let filteredPatients = [...patients];

        // Search by name
        if (search) {
            const searchLower = sanitizeInput(search).toLowerCase();
            filteredPatients = filteredPatients.filter(p =>
                p.full_name.toLowerCase().includes(searchLower)
            );
        }

        // Pagination
        const pageInt = parseInt(page);
        const limitInt = parseInt(limit);
        const total = filteredPatients.length;
        const total_pages = Math.ceil(total / limitInt) || 1;
        const startIndex = (pageInt - 1) * limitInt;
        const paginatedPatients = filteredPatients.slice(startIndex, startIndex + limitInt);

        res.status(200).json({
            status: "success",
            message: "Patients retrieved successfully.",
            data: {
                total,
                page: pageInt,
                limit: limitInt,
                total_pages,
                patients: paginatedPatients
            }
        });
    } catch (error) {
        console.error('Get patients error:', error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error occurred."
        });
    }
}


// 10. Get Patient Detail API
exports.getPatientDetail = (req, res) => {
    try {
        const patientId = parseInt(req.params.patient_id);
        
        // Find patient and check ownership
        const patient = patients.find(p => p.id === patientId);

        if (!patient) {
            return res.status(404).json({
                status: "error",
                message: "Patient not found."
            });
        }

        res.status(200).json({
            status: "success",
            message: "Patient retrieved successfully.",
            patient: patient
        });
    } catch (error) {
        console.error('Get patient detail error:', error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error occurred."
        });
    }
}

// 11. Update Patient API
exports.updatePatient = (req, res) => {
    try {
        const patientId = parseInt(req.params.patient_id);
        
        // Find patient
        const patientIdx = patients.findIndex(p => p.id === patientId);

        //Case not found
        if (patientIdx === -1) {
            return res.status(404).json({
                status: "error",
                message: "Patient not found."
            });
        }

        // Check duplicate CCCD if updating
        if (req.body.cccd && req.body.cccd !== patients[patientIdx].cccd) {
            const duplicateCCCD = patients.find(p => p.cccd === req.body.cccd);
            if (duplicateCCCD) {
                return res.status(400).json({
                    status: "error",
                    message: "Invalid field values."
                });
            }
        }

        // Prepare update data
        const updateData = {};
        const allowedFields = ['cccd', 'full_name', 'birthday', 'address', 'phone', 'room'];
        
        //Lọc data
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = sanitizeInput(req.body[field]);
            }
        });

        // Update patient
        patients[patientIdx] = { 
            ...patients[patientIdx], 
            ...updateData 
        };

        res.status(200).json({
            status: "success",
            message: "Patient information updated successfully.",
            patient: patients[patientIdx]
        });
    } catch (error) {
        console.error('Update patient error:', error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error occurred."
        });
    }
}

// 12. Get Patient Health Info API
exports.getHealthInfo = (req, res) => {
    try {
        const patientId = parseInt(req.params.patient_id);
        
        // Find patient and check ownership
        const patient = patients.find(p => p.id === patientId);

        //Case not found
        if (!patient) {
            return res.status(404).json({
                status: "error",
                message: "Patient not found."
            });
        }

        // Mock health data (in production, fetch from health monitoring system)
        const healthInfo = {
            heart_rate: "72 bpm",
            SpO2: "98%",
            temperature: "36.8°C",
            weight: "70 kg",
            height: "175 cm",
            bmi: "22.9",
            last_measurement: new Date().toISOString(),
            alarm_status: "Normal",
        };

        res.status(200).json({
            status: "success",
            patient_id: patientId,
            health_info: healthInfo
        });
    } catch (error) {
        console.error('Get patient health error:', error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error occurred."
        });
    }
}

// 13. Delete Patient API
exports.deletePatient = (req, res) => {
    try {
        const patientId = parseInt(req.params.patient_id);
        
        // Find patient and check ownership
        const patientIdx = patients.findIndex(p => p.id === patientId);

        //case not found
        if (patientIdx === -1) {
            return res.status(404).json({
                status: "error",
                message: "Patient not found."
            });
        }

        // Remove patient
        patients.splice(patientIdx, 1);

        res.status(200).json({
            status: "success",
            message: "Patient deleted successfully.",
            deleted_patient_id: patientId
        });
    } catch (error) {
        console.error('Delete patient error:', error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error occurred."
        });
    }
}