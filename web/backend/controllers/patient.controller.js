const patients = require('../data/patients')
const { sanitizeInput } = require('../utils/validator')
const tokenStore = require('../utils/token-store');

const THINGSBOARD_URL = "http://localhost:8080";

async function findAndCacheDeviceID(patient, token) {
    if(patient.device_id){
        return patient.device_id;
    }

    console.log('Searching for device for CCCD:', patient.cccd);

    try{
        const response = await fetch(`${THINGSBOARD_URL}/api/tenant/devices?pageSize=1000&page=0`, {
            method: "GET",
            headers: {
                'X-Authorization': `Bearer ${token}`,
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch devices: ${response.status}`);
        }

        const deviceData = await response.json();
        const devices = deviceData.data || [];

        for(const device of devices){
            try{
                const attrResponse  = await fetch(`${THINGSBOARD_URL}/api/plugins/telemetry/DEVICE/${device.id.id}/values/attributes?keys=cccd`, {
                    method: "GET",
                    headers: {
                        'X-Authorization': `Bearer ${token}`,
                    }
                });

                if (!attrResponse.ok) {
                    console.warn(`Could not fetch attributes for device ${device.id.id}`);
                    continue;
                }
                // ThingsBoard returns array of {key, value} objects
                const attributes = await attrResponse.json();
                const cccdAttr = attributes.find(attr => attr.key == 'cccd');
                
                if(cccdAttr && cccdAttr.value == patient.cccd){
                    console.log(`Device found: ${device.id.id} for CCCD ${patient.cccd}`);
                    patient.device_id = device.id.id;
                    return device.id.id;
                }
            }catch(err){
                console.warn(`Could not fetch attributes for device ${device.id.id}`, err.message);
            }
        }
        console.log(`No device found for CCCD: ${patient.cccd}`);
        return null;
    } catch(err){
        console.error('Error searching for device:', err.message);
        return null;
    }
}

async function deleteDeviceFromThingsBoard(deviceId, token) {
    try {
        const response = await fetch(`${THINGSBOARD_URL}/api/device/${deviceId}`, {
            method: "DELETE",
            headers:{
                'X-Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to delete device: ${response.status}`);
        }

        console.log(`Device ${deviceId} deleted successfully from ThingsBoard`);
        return true;
    } catch(err) {
        console.error(`Failed to delete device ${deviceId}:`, err.message);
        throw err;
    }
}

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

        //gen ID -> 
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
exports.getHealthInfo = async (req, res) => {
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

        // fetch thingsboard (device -> deviceid)
        // GET /api/tenant/devices -> get list device 
        // Duyệt từng device -> GET /api/plugins/telemetry/DEVICE/{deviceid}/keys/attributes?scopes=CLIENT_SCOPE
        // -> tách trường cccd để gán cho từng bệnh nhân cụ thể
        // -> từ deviceid -> GET /api/plugins/telemetry/DEVICE/{deviceid}/keys/timeseries
        // Mock health data (in production, fetch from health monitoring system)

        // Check authorization for doctors
        if (req.user.role === 'doctor' && patient.doctor_id !== req.user.id) {
            return res.status(403).json({
                status: "error",
                message: "Permission denied."
            });
        }

        const token = tokenStore.findThingsBoardToken(req.user.id);
        if (!token) {
            return res.status(503).json({
                status: "error",
                message: "ThingsBoard connection not available."
            });
        }
        // Find device ID for this patient
        const deviceId = await findAndCacheDeviceID(patient, token);

        if (!deviceId) {
            return res.status(404).json({
                status: "error",
                message: "Device not found for this patient on ThingsBoard."
            });
        }

        const response = await fetch(`${THINGSBOARD_URL}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=heart_rate,SpO2,temperature,alarm`, {
            method: "GET",
            headers: {
                'X-Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`ThingsBoard telemetry fetch failed: ${response.status}`);
        }

        const telemetryData  = await response.json();
        console.log(telemetryData);

        const healthInfo = Object.fromEntries(
            Object.entries(telemetryData).map(([key, values]) => {
                const latest = Array.isArray(values) && values.length > 0
                ? values[values.length - 1].value
                : null;
                return [key, latest];
            })
        );

        const payload = {
            heart_rate: healthInfo.heart_rate ? parseFloat(healthInfo.heart_rate) : null,
            SpO2: healthInfo.SpO2 ? parseFloat(healthInfo.SpO2) : null,
            temperature: healthInfo.temperature ? parseFloat(healthInfo.temperature) : null,
            last_measurement: new Date().toISOString(),
            alarm_status: healthInfo.alarm || null,
        };

        res.status(200).json({
            status: "success",
            patient_id: patientId,
            health_info: payload
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
exports.deletePatient = async (req, res) => {
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

        const patient = patients[patientIdx];

        // Xóa thiết bị trên thingsboard
        // Đã được cung cấp thiết bị? -> xóa thiết bị trên thingsboard
        // DELETE /api/device/{deviceid}
        // Remove patient
        // Get ThingsBoard token

                // Check authorization for doctors
        if (req.user.role === 'doctor' && patient.doctor_id !== req.user.id) {
            return res.status(403).json({
                status: "error",
                message: "Permission denied."
            });
        }

        const token = tokenStore.findThingsBoardToken(req.user.id);
        if (!token) {
            return res.status(503).json({
                status: "error",
                message: "ThingsBoard connection not available."
            });
        }
   
        if (token) {
            // Try to find and delete device on ThingsBoard
            const deviceId = await findAndCacheDeviceID(patient, token);
            
            if (deviceId) {
                console.log(`Deleting device ${deviceId} from ThingsBoard...`);
                try {
                    await deleteDeviceFromThingsBoard(deviceId, token);
                } catch (err) {
                    console.error(`Failed to delete device ${deviceId}:`, err.message);
                }
            }
        }

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