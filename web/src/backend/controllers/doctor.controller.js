const { sanitizeInput } = require('../utils/validator');
const tokenStore = require('../utils/token-store');
const Doctor = require('../models/doctor.model');
const User = require('../models/user.model');

const THINGSBOARD_URL = "http://localhost:8080";

async function createTenantAccount(doctor, email, name, password, systoken){
	try{

	    const createTenantResp = await fetch(`${THINGSBOARD_URL}/api/tenant`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `Bearer ${systoken}`
            },
            body: JSON.stringify({
                title: `${name} - ${password}`
            })
        });
        if (!createTenantResp.ok) {
            const err = await createTenantResp.text();
            throw new Error(`Failed to create tenant: ${createTenantResp.status} - ${err}`);
        }

		const tenantJSON = await createTenantResp.json();

		const payload = {
			authority: 'TENANT_ADMIN',
			tenantId: { 
				id: tenantJSON.id.id,
				entityType: 'TENANT'
			},
			email: email,
			firstName: name
		};

		const activeAccountResp = await fetch(`${THINGSBOARD_URL}/api/user?sendActivationMail=false`, {
			method: "POST",
			body: JSON.stringify(payload),
			headers: {
				"Content-Type": "application/json",
				"X-Authorization": `Bearer ${systoken}`
			}
		});

		if(!activeAccountResp.ok){
			const err = await activeAccountResp.text();
			throw new Error(`ThingsBoard API error: ${activeAccountResp.status} - ${err}`);
		}

		const data = await activeAccountResp.json();
		await Doctor.updateOne(
			{ _id: doctor._id },
			{tenantAccountID: data.id.id}
		);
		
		const tokenResp = await fetch(`${THINGSBOARD_URL}/api/user/${data.id.id}/activationLink`, {
            method: "GET",
            headers: {
                "X-Authorization": `Bearer ${systoken}`
            }
        });

		if (!tokenResp.ok) {
            const err = await tokenResp.text();
            throw new Error(`Failed to get activation token: ${tokenResp.status} - ${err}`);
        }

		const activationLink = await tokenResp.text();
        const activationToken = new URL(activationLink).searchParams.get('activateToken');

		const activateResp = await fetch(`${THINGSBOARD_URL}/api/noauth/activate?sendActivationMail=false`, {
            method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				activateToken: activationToken,
				password: password
			})
        });

        if (!activateResp.ok) {
            const err = await activateResp.text();
            throw new Error(`Failed to activate user: ${activateResp.status} - ${err}`);
        }

		return data;
	}catch(err){
		console.error('Failed to create tenant admin:', err.response?.data || err.message);
		throw err;
	}
}

async function deleteTenantAccount(userId, systoken){
	try{
		const res = await fetch(`${THINGSBOARD_URL}/api/user/${userId}`, {
			method: "DELETE",
			headers:{
				"X-Authorization": `Bearer ${systoken}`
			}
		});

		if (!res.ok) {
			const err = await res.text();
			throw new Error(`ThingsBoard API error: ${res.status} - ${err}`);
		}

		console.log(`Tenant account ${userId} deleted successfully`);
		return true;
	}catch(err){
		throw err;
	}
}

// 3. Create Doctor API
exports.createDoctor = async (req, res) => {
	try {
		const doctorData = {
			cccd: sanitizeInput(req.body.cccd),
			full_name: sanitizeInput(req.body.full_name),
			email: sanitizeInput(req.body.email),
			password: sanitizeInput(req.body.phone),
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

		await User.updateOne(
			{ _id: user._id},
			{ doctorId: doctor._id }
		);

		//create a new tenant account on thingsboard
		const systoken = tokenStore.findThingsBoardToken(req.user.id);

		if(systoken){
			try{
				await createTenantAccount(
					doctor,								//object doctor
					doctor.cccd + "@thingsboard.local",	//email
					doctor.full_name,					//name
					doctor.cccd,						//password
					systoken							//token thingsboard
				);
			}catch(err){
				console.error('ThingsBoard tenant creation failed:', err.message);
			}
		}else{
			console.log("Doesn't have sysadmin account");
		}

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
				updateData[field] = sanitizeInput(req.body[field]);
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

		//Delete tenant account on thingsboard
		const systoken = tokenStore.findThingsBoardToken(req.user.id);
		if(systoken && doctor.tenantAccountID){
			try{
				await deleteTenantAccount(doctor.tenantAccountID, systoken);
			}catch(err){
				console.error('ThingsBoard tenant deletion failed:', err.message);
			}
		}

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