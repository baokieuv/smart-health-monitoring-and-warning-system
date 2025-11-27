const bcrypt = require('bcryptjs');
const { sanitizeInput } = require('../utils/validator');
const tokenStore = require('../utils/token-store');
const Patient = require('../models/patient.model');
const User = require('../models/user.model');
const Device = require('../models/device.model');
const Doctor = require('../models/doctor.model');

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
                const attrResponse  = await fetch(`${THINGSBOARD_URL}/api/plugins/telemetry/DEVICE/${device.id.id}/values/attributes?keys=patient,doctor`, {
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
                const patientCCCD = attributes.find(attr => attr.key == 'patient');
                const doctorCCCD = attributes.find(attr => attr.key == 'doctor')
                
                const patientValue = patientCCCD ? String(patientCCCD.value) : null;
                const doctorValue  = doctorCCCD ? String(doctorCCCD.value) : null;

                const normalizedPatientValue = patientValue?.padStart(patient.cccd.length, '0');
                const normalizeDoctorCCCD = doctorValue?.padStart(patient.cccd.length, '0');

                console.log(normalizeDoctorCCCD);
                console.log(normalizedPatientValue)

                const doctor = await Doctor.findOne({ cccd: normalizeDoctorCCCD });
                
                if(normalizedPatientValue === patient.cccd){
                    console.log(`Device found: ${device.id.id} for CCCD ${patient.cccd}`);
                    //-> gán access token 
                    await Patient.updateOne(
                        { _id: patient._id },
                        { deviceId: device.id.id }
                    );

                    await Device.create({
                        name: device.name,
                        deviceId: device.id.id,
                        doctorCCCD: normalizeDoctorCCCD,
                        patientCCCD: normalizedPatientValue,
                        doctorId: doctor._id,
                        patientId: patient._id
                    });

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

exports.getDetail = async (req, res) => {
    try{
        const doctor = await Doctor.findOne({userId: req.user.id});

        if(!doctor){
            return res.status(404).json({
                status: 'error',
                message: 'User not found.'
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'User retrieved successfully.',
            data: doctor
        });
    }catch(err){
        console.error('Create patient error:', err);
        return res.status(500).json({
            status: "error",
            message: "Unexpected error occurred."
        });
    }
}

exports.updateDetail = async (req, res) => {
    try{
        const doctor = await Doctor.findOne({userId: req.user.id});

        if(!doctor){
            return res.status(404).json({
                status: 'error',
                message: 'User not found.'
            });
        }
        const updateFields = ['full_name', 'email', 'birthday', 'address', 'phone', 'specialization'];
        const updateData = {};

        updateFields.forEach(field => {
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

        const result = await Doctor.findByIdAndUpdate(
            doctor._id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            status: "success",
            message: "Doctor information updated successfully.",
            doctor: result
        });
        
    }catch(err){
        console.error('Create patient error:', err);
        return res.status(500).json({
            status: "error",
            message: "Unexpected error occurred."
        });
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

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(patientData.phone, salt);

        //Add new patient
        const user = await User.create({
            username: patientData.cccd,
            password: hashedPassword,
            role: "patient"
        });
        const newPatient = await Patient.create({
            ...patientData,
            userId: user._id,
            doctorId: req.user.id   //userId của doctor
        });

        return res.status(201).json({
            status: "success",
            message: "Patient created successfully.",
            patient: newPatient
        });
    } catch (err) {
        console.error('Create patient error:', err);
        return res.status(500).json({
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

        return res.status(200).json({
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
    } catch (err) {
        console.error('Get patients error:', err);
        return res.status(500).json({
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

        return res.status(200).json({
            status: "success",
            message: "Patient retrieved successfully.",
            patient: patient
        });
    } catch (err) {
        console.error('Get patient detail error:', err);
        return res.status(500).json({
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

        return res.status(200).json({
            status: "success",
            message: "Patient information updated successfully.",
            patient: result
        });
    } catch (err) {
        console.error('Update patient error:', err);
        return res.status(500).json({
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
        
        if(!patient.deviceId){
            return res.status(200).json({
                status: "error",
                message: "Patient is not allocated device"
            });
        }

        const response = await fetch(`${THINGSBOARD_URL}/api/plugins/telemetry/DEVICE/${patient.deviceId}/values/timeseries?keys=heart_rate,SpO2,temperature,alarm`, {
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

        return res.status(200).json({
            status: "success",
            patient_id: patient._id,
            health_info: payload
        });
    } catch (err) {
        console.error('Get patient health error:', err);
        return res.status(500).json({
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

        if(patient.deviceId){
            const token = tokenStore.findThingsBoardToken(req.user.id);
            console.log(`Deleting device ${patient.deviceId} from ThingsBoard...`);
            try {
                await deleteDeviceFromThingsBoard(patient.deviceId, token);
            } catch (err) {
                console.error(`Failed to delete device ${patient.deviceId}:`, err.message);
            }
        }

        await User.deleteOne({ _id: patient.userId });
        await Patient.deleteOne({ _id: patient._id });
        await Device.deleteOne({ deviceId: patient.deviceId });

        return res.status(200).json({
            status: "success",
            message: "Patient deleted successfully.",
            deleted_patient_id: patient._id
        });
    } catch (err) {
        console.error('Delete patient error:', err);
        return res.status(500).json({
            status: "error",
            message: "Unexpected error occurred."
        });
    }
}

exports.allocateDevice = async(req, res) => {
    try{
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

        if(patient.deviceId){
            return res.status(400).json({
                status: "error",
                message: "Patient already has a device allocated."
            });
        }

        const token = tokenStore.findThingsBoardToken(req.user.id);
        if (!token) {
            return res.status(503).json({
                status: "error",
                message: "ThingsBoard connection not available."
            });
        }

        const deviceId = await findAndCacheDeviceID(patient, token);
        if(!deviceId){
            console.log("Patient is not allocated device");
            return res.status(400).json({
                status: "error",
                message: "Patient is not allocated device"
            })
        }

        return res.status(200).json({
            status: "success",
            message: "Device allocated successfully.",
            device_id: deviceId
        });

    }catch(err){
        console.error('Allocate device error:', err);
        return res.status(500).json({
            status: "error",
            message: "Unexpected error occurred."
        })
    }
}

exports.recallDevice = async(req, res) => {
    try{
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

        if(!patient.deviceId){
            return res.status(400).json({
                status: "error",
                message: "Patient does not have any device allocated."
            });
        }

        const token = tokenStore.findThingsBoardToken(req.user.id);
        console.log(`Deleting device ${patient.deviceId} from ThingsBoard...`);
        try {
            await deleteDeviceFromThingsBoard(patient.deviceId, token);
        } catch (err) {
            console.error(`Failed to delete device ${patient.deviceId}:`, err.message);
        }

        await Patient.updateOne(
            { _id: patient._id },
            { deviceId: null }
        )

        await Device.deleteOne({ deviceId:  patient.deviceId});

        return res.status(200).json({
            status: "success",
            message: "Device recalled successfully.",
            device_id: patient.deviceId
        });
    }catch(err){
        console.error('Recall device error:', err);
        return res.status(500).json({
            status: "error",
            message: "Unexpected error occurred."
        })
    }
}