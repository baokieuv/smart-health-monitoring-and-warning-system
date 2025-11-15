const { sanitizeInput } = require('../utils/validator')
const tokenStore = require('../utils/token-store');
const Patient = require('../models/patient.model');
const User = require('../models/user.model');

const THINGSBOARD_URL = "http://localhost:8080";

async function findAndCacheDeviceID(patient, token) {
    if(patient.deviceId){
        return patient.deviceId;
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
                    //-> gán access token 
                    await Patient.updateOne(
                        { _id: patient._id },
                        { deviceId: device.id.id }
                    );

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
exports.createPatient = async (req, res) => {
    try {
        const patientData = {
            cccd: sanitizeInput(req.body.cccd),
            full_name: sanitizeInput(req.body.full_name),
            birthday: req.body.birthday,
            address: sanitizeInput(req.body.address),
            phone: sanitizeInput(req.body.phone),
            room: sanitizeInput(req.body.room)
        };

        // Check duplicate CCCD
        const existingPatient  = await Patient.findOne({ cccd: patientData.cccd });
        if (existingPatient) {
            return res.status(409).json({
                status: "error",
                message: "User already exists."
            });
        }

        //Add new patient
        const user = await User.create({
            username: patientData.cccd,
            password: patientData.phone,
            role: "patient"
        });
        const newPatient = await Patient.create({
            ...patientData,
            userId: user._id,
            doctorId: req.user.id   //userId của doctor
        });

        await User.updateOne(
            { _id: user._id },
            { patientId: newPatient._id }
        );

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

exports.getPatients = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        let query = { doctorId: req.user.id };

        // Search by name
        if (search) {
            const searchRegex = new RegExp(sanitizeInput(search), 'i');
            query.full_name = searchRegex;
        }

        // Pagination
        const pageInt = parseInt(page);
        const limitInt = parseInt(limit);
        const skip = (pageInt - 1) * limitInt;

        const total = await Patient.countDocuments(query);
        const patients = await Patient.find(query)
            .skip(skip)
            .limit(limitInt)
            .lean();

        const total_pages = Math.ceil(total / limitInt) || 1;

        res.status(200).json({
            status: "success",
            message: "Patients retrieved successfully.",
            data: {
                total,
                page: pageInt,
                limit: limitInt,
                total_pages,
                patients
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
exports.getPatientDetail = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.patient_id);

        if (!patient) {
            return res.status(404).json({
                status: "error",
                message: "Patient not found."
            });
        }

        // check doctor id
        if(patient.doctorId.toString() !== req.user.id.toString()){
            return res.status(403).json({
                status: "error",
                message: "Permission denied."
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
exports.updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.patient_id);

        //Case not found
        if (!patient) {
            return res.status(404).json({
                status: "error",
                message: "Patient not found."
            });
        }

        // check doctor id
        if(patient.doctorId.toString() !== req.user.id.toString()){
            return res.status(403).json({
                status: "error",
                message: "Permission denied."
            });
        }

        // Prepare update data
        const updateData = {};
        const allowedFields = ['full_name', 'birthday', 'address', 'phone', 'room'];
        
        //Lọc data
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = field === 'birthday' ? req.body[field] : sanitizeInput(req.body[field]);
            }
        });

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                status: "error",
                message: "No valid fields to update."
            });
        }

        const result = await Patient.findByIdAndUpdate(
            patient._id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            status: "success",
            message: "Patient information updated successfully.",
            patient: result
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
        const patient = await Patient.findById(req.params.patient_id);
        //Case not found
        if (!patient) {
            return res.status(404).json({
                status: "error",
                message: "Patient not found."
            });
        }

        // check doctor id
        if(patient.doctorId.toString() !== req.user.id.toString()){
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
            patient_id: patient._id,
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
        const patient = await Patient.findById(req.params.patient_id);

        //case not found
        if (!patient) {
            return res.status(404).json({
                status: "error",
                message: "Patient not found."
            });
        }

        // check doctor id
        if(patient.doctorId.toString() !== req.user.id.toString()){
            return res.status(403).json({
                status: "error",
                message: "Permission denied."
            });
        }

        const token = tokenStore.findThingsBoardToken(req.user.id);
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

        await User.deleteOne({ patientId: patient._id });
        await Patient.deleteOne({ _id: patient._id });

        res.status(200).json({
            status: "success",
            message: "Patient deleted successfully.",
            deleted_patient_id: patient._id
        });
    } catch (error) {
        console.error('Delete patient error:', error);
        res.status(500).json({
            status: "error",
            message: "Unexpected error occurred."
        });
    }
}