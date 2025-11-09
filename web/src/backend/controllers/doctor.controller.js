const doctors = require('../data/doctors');
const { sanitizeInput } = require('../utils/validator');
const tokenStore = require('../utils/token-store');

const THINGSBOARD_URL = "http://localhost:8080";
const ADMIN_ID = 'admin';

async function createTenantAccount(userId, email, name, phone, systoken){
	try{

	    const tenantRes = await fetch(`${THINGSBOARD_URL}/api/tenant`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Authorization": `Bearer ${systoken}`
            },
            body: JSON.stringify({
                title: `doctor${userId}`
            })
        });
        if (!tenantRes.ok) {
            const err = await tenantRes.text();
            throw new Error(`Failed to create tenant: ${tenantRes.status} - ${err}`);
        }
		const tenant = await tenantRes.json();

		const payload = {
			authority: 'TENANT_ADMIN',
			tenantId: { 
				id: tenant.id.id,
				entityType: 'TENANT'
			},
			email: email + "@thingsboard.local",
			firstName: name,
			phone: phone,
		};

		const res = await fetch(`${THINGSBOARD_URL}/api/user?sendActivationMail=false`, {
			method: "POST",
			body: JSON.stringify(payload),
			headers: {
				"Content-Type": "application/json",
				"X-Authorization": `Bearer ${systoken}`
			}
		});

		if(!res.ok){
			const errorText = await res.text();
			throw new Error(`ThingsBoard API error: ${res.status} - ${errorText}`);
		}

		const data = await res.json();
		console.log('Tenant Admin created successfully:', data);

		const doctorIndex = doctors.findIndex(doc => doc.id == userId);
		console.log(doctorIndex);
		doctors[doctorIndex] = {
			...doctors[doctorIndex],
			tenantid: data.id.id
		}

		console.log(doctors[doctorIndex])
		const tokenRes = await fetch(`${THINGSBOARD_URL}/api/user/${data.id.id}/activationLink`, {
            method: "GET",
            headers: {
                "X-Authorization": `Bearer ${systoken}`
            }
        });

		if (!tokenRes.ok) {
            const err = await tokenRes.text();
            throw new Error(`Failed to get activation token: ${tokenRes.status} - ${err}`);
        }

		const activationLink = await tokenRes.text();
        const activationToken = new URL(activationLink).searchParams.get('activateToken');

		console.log(activationLink);
		console.log(activationToken);
		const activateRes = await fetch(`${THINGSBOARD_URL}/api/noauth/activate?sendActivationMail=false`, {
            method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				activateToken: activationToken,
				password: phone
			})
        });

        if (!activateRes.ok) {
            const err = await activateRes.text();
            throw new Error(`Failed to activate user: ${activateRes.status} - ${err}`);
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
			const errorText = await res.text();
			throw new Error(`ThingsBoard API error: ${res.status} - ${errorText}`);
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

		const duplicateDoctor = doctors.find(doctor => doctor.cccd === doctorData.cccd);
		if (duplicateDoctor) {
			return res.status(409).json({
				status: "error",
				message: "User already exists."
			});
		}

		const newId = doctors.length > 0 ? Math.max(...doctors.map(doc => doc.id)) + 1 : 1;
		const newDoctor = { id: newId, ...doctorData };

		doctors.push(newDoctor);

		//create a new tenant account on thingsboard
		const systoken = tokenStore.findThingsBoardToken(ADMIN_ID);

		if(systoken){
			try{
				await createTenantAccount(newId.toString(),
					doctorData.cccd,
					doctorData.full_name,
					doctorData.phone,
					systoken
				);
			}catch(err){
				console.error('ThingsBoard tenant creation failed:', err.message);
			}
		}

		const { password, ...doctorResponse } = newDoctor;

		res.status(201).json({
			status: "success",
			message: "Doctor created successfully.",
			doctor: doctorResponse
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
exports.getDoctors = (req, res) => {
	try {
		const { page = 1, limit = 10, search = '', specialization = '' } = req.query;

		let filteredDoctors = [...doctors];

		if (search) {
			const searchLower = sanitizeInput(search).toLowerCase();
			filteredDoctors = filteredDoctors.filter(doctor =>
				doctor.full_name.toLowerCase().includes(searchLower)
			);
		}

		if (specialization) {
			const specialLower = sanitizeInput(specialization).toLowerCase();
			filteredDoctors = filteredDoctors.filter(doctor =>
				doctor.specialization.toLowerCase().includes(specialLower)
			);
		}

		const pageInt = parseInt(page);
		const limitInt = parseInt(limit);
		const total = filteredDoctors.length;
		const total_pages = Math.ceil(total / limitInt) || 1;
		const startIndex = (pageInt - 1) * limitInt;
		const paginatedDoctors = filteredDoctors.slice(startIndex, startIndex + limitInt);

		res.status(200).json({
			status: "success",
			message: "Doctor retrieved successfully.",
			data: {
				total,
				page: pageInt,
				limit: limitInt,
				total_pages,
				doctors: paginatedDoctors
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
exports.getDoctorDetail = (req, res) => {
	try {
		const doctorId = parseInt(req.params.doctor_id);
		const doctor = doctors.find(doc => doc.id === doctorId);

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

// 6. Update Doctor API
exports.updateDoctor = (req, res) => {
	try {
		const doctorId = parseInt(req.params.doctor_id);
		const doctorIndex = doctors.findIndex(doc => doc.id === doctorId);

		if (doctorIndex === -1) {
			return res.status(404).json({
				status: "error",
				message: "Doctor not found."
			});
		}

		const updateFields = ['cccd', 'full_name', 'birthday', 'address', 'phone', 'specialization'];
		const updateData = {};

		updateFields.forEach(field => {
			if (req.body[field] !== undefined) {
				updateData[field] = sanitizeInput(req.body[field]);
			}
		});

		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({
				status: "error",
				message: "Invalid field values."
			});
		}

		if (updateData.cccd && updateData.cccd !== doctors[doctorIndex].cccd) {
			const duplicateCCCD = doctors.find(doc => doc.cccd === updateData.cccd);
			if (duplicateCCCD) {
				return res.status(400).json({
					status: "error",
					message: "Invalid field values."
				});
			}
		}

		if (updateData.phone && updateData.phone !== doctors[doctorIndex].phone) {
			const duplicatePhone = doctors.find(doc => doc.phone === updateData.phone);
			if (duplicatePhone) {
				return res.status(400).json({
					status: "error",
					message: "Invalid field values."
				});
			}
		}

		doctors[doctorIndex] = {
			...doctors[doctorIndex],
			...updateData
		};

		res.status(200).json({
			status: "success",
			message: "Doctor information updated successfully.",
			doctor: doctors[doctorIndex]
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
		const doctorId = parseInt(req.params.doctor_id);
		const doctorIndex = doctors.findIndex(doc => doc.id === doctorId);

		if (doctorIndex === -1) {
			return res.status(404).json({
				status: "error",
				message: "Doctor not found."
			});
		}

		//Delete tenant account on thingsboard
		const systoken = tokenStore.findThingsBoardToken(ADMIN_ID);
		if(systoken){
			try{
				await deleteTenantAccount(doctors[doctorIndex].tenantid, systoken);
			}catch(err){
				console.error('ThingsBoard tenant deletion failed:', err.message);
			}
		}

		doctors.splice(doctorIndex, 1);
		
		res.status(200).json({
			status: "success",
			message: "Doctor deleted successfully.",
			deleted_doctor_id: doctorId
		});
	} catch (error) {
		console.error('Delete doctor error:', error);
		res.status(500).json({
			status: "error",
			message: "Unexpected error occurred."
		});
	}
};
