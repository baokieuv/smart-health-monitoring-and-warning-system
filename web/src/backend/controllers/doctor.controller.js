const { sanitizeInput } = require('../utils/validator');
const Doctor = require('../models/doctor.model');
const User = require('../models/user.model');
const Device = require('../models/device.model');

// 3. Create Doctor API
exports.createDoctor = async (req, res) => {
	try {
		const doctorData = {
			cccd: sanitizeInput(req.body.cccd),
			full_name: sanitizeInput(req.body.full_name),
			email: sanitizeInput(req.body.email),
			birthday: req.body.birthday,
			address: sanitizeInput(req.body.address),
			phone: sanitizeInput(req.body.phone),
			specialization: sanitizeInput(req.body.specialization)
		};

		const duplicateDoctor = await Doctor.findOne({cccd: doctorData.cccd});

		if (duplicateDoctor) {
			return res.status(409).json({
				status: "error",
				message: "User already exists."
			});
		}

		const user = await User.create({
			username: doctorData.cccd,
			password: doctorData.phone,
			role: "doctor",
		});

		const doctor = await Doctor.create({
			...doctorData,
			userId: user._id
		});

		res.status(201).json({
			status: "success",
			message: "Doctor created successfully.",
			doctor: doctor
		});
	} catch (error) {
		console.error('Create doctor error:', error);
		res.status(500).json({
			status: "error",
			message: "Unexpected error occurred."
		});
	}
};

// 4. Get Doctor List API
exports.getDoctors = async (req, res) => {
	try {
		const { page = 1, limit = 10, search = '', specialization = '' } = req.query;
		let query = {};

		if (search) {
			const searchRegex = new RegExp(sanitizeInput(search), 'i');
			query.full_name = searchRegex;
		}

		if (specialization) {
			const searchRegex = new RegExp(sanitizeInput(specialization), 'i');
			query.specialization = searchRegex;
		}

		const pageInt = parseInt(page);
		const limitInt = parseInt(limit);
		const skip = (pageInt - 1) * limitInt;

		const total = await Doctor.countDocuments(query);
		const doctors = await Doctor.find(query)
            .skip(skip)
            .limit(limitInt)
            .lean();

		const total_pages = Math.ceil(total / limitInt) || 1;

		res.status(200).json({
			status: "success",
			message: "Doctor retrieved successfully.",
			data: {
				total,
				page: pageInt,
				limit: limitInt,
				total_pages,
				doctors
			}
		});
	} catch (error) {
		console.error('Get doctors error:', error);
		res.status(500).json({
			status: "error",
			message: "Unexpected error occurred."
		});
	}
};

// 5. Get Doctor Detail API
exports.getDoctorDetail = async (req, res) => {
	try {
		const doctor = await Doctor.findById(req.params.doctor_id);

		if (!doctor) {
			return res.status(404).json({
				status: "error",
				message: "Doctor not found."
			});
		}

		res.status(200).json({
			status: "success",
			message: "Doctor retrieved successfully.",
			doctor
		});
	} catch (error) {
		console.error('Get doctor detail error:', error);
		res.status(500).json({
			status: "error",
			message: "Unexpected error occurred."
		});
	}
};

// 6. Update Doctor API -> ko update cccd (mỗi người là duy nhất)
exports.updateDoctor = async (req, res) => {
	try {
		const doctor = await Doctor.findById(req.params.doctor_id);

		if(!doctor){
			return res.status(404).json({
				status: "error",
				message: "Doctor not found."
			});
		}

		const updateFields = ['full_name', 'birthday', 'address', 'phone', 'specialization'];
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

		res.status(200).json({
			status: "success",
			message: "Doctor information updated successfully.",
			doctor: result
		});
	} catch (error) {
		console.error('Update doctor error:', error);
		res.status(500).json({
			status: "error",
			message: "Unexpected error occurred."
		});
	}
};

// 7. Delete Doctor API
exports.deleteDoctor = async (req, res) => {
	try {
		const doctor = await Doctor.findById(req.params.doctor_id);

		if (!doctor) {
			return res.status(404).json({
				status: "error",
				message: "Doctor not found."
			});
		}

		// Xóa danh sách device của doctor
		await Device.deleteMany({ doctorId: doctor._id });

		await User.deleteOne({ doctorId: doctor._id });
		await Doctor.deleteOne({ _id: doctor._id });
		
		res.status(200).json({
			status: "success",
			message: "Doctor deleted successfully.",
			deleted_doctor_id: doctor._id
		});
	} catch (error) {
		console.error('Delete doctor error:', error);
		res.status(500).json({
			status: "error",
			message: "Unexpected error occurred."
		});
	}
};

exports.getListDevice = async (req, res) => {
	try{
		const { page = 1, limit = 10 } = req.query;

		const pageInt = parseInt(page);
		const limitInt = parseInt(limit);
		const skip = (pageInt - 1) * limitInt;

		const total = await Device.countDocuments();
		const total_pages = Math.ceil(total / limitInt) || 1;

		const devices = await Device.find()
			.populate({
				path: 'doctorId',
				select: '_id full_name cccd phone specialization'
			})
			.populate({
				path: 'patientId',
				select: '_id full_name cccd phone room'
			})
			.skip(skip).limit(limitInt).lean();

		const formattedDevices = devices.map(device => ({
			device_id: device._id,
			device_name: device.name,
			thingsboard_device_id: device.deviceId,
			doctor: device.doctorId  ? {
				id: device.doctorId._id,
				name: device.doctorId.full_name,
				cccd: device.doctorId.cccd,
				phone: device.doctorId.phone,
				specialization: device.doctorId.specialization
			} : null,
			patient: device.patientId ? {
				id: device.patientId._id,
				name: device.patientId.full_name,
				cccd: device.patientId.cccd,
				phone: device.patientId.phone,
				room: device.patientId.room
			} : null,
		}));

		return res.status(200).json({
				status: "success",
				message: "Devices retrieved successfully.",
				data: {
					total,
					page: pageInt,
					limit: limitInt,
					total_pages,
					devices: formattedDevices
				}
			});
	}catch(err){
		console.error('Get list device error:', err);
		return res.status(500).json({
				status: "error",
				message: "Unexpected error occurred."
			});
	}
}