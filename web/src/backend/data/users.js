// Single admin account - no relation to doctors table
const ADMIN_ACCOUNT = {
	id: 'admin',
	username: 'sysadmin@thingsboard.org',
	password: 'sysadmin',
	fullName: 'System Administrator',
	role: 'admin'
};

// Helper function to get user by username
// username can be email (for admin) or cccd (for doctors)
exports.findUserByUsername = (username) => {
	const normalizedUsername = username.toLowerCase().trim();
	
	// Check if it's email format (admin login)
	if (normalizedUsername.includes('@')) {
		if (ADMIN_ACCOUNT.username === normalizedUsername) {
			return ADMIN_ACCOUNT;
		}
		return null; // No doctor login with email
	}
	
	// Otherwise, treat as CCCD (doctor login)
	const doctors = require('./doctors');
	const doctor = doctors.find(doc => doc.cccd === normalizedUsername);
	
	if (doctor) {
		return {
			id: doctor.id,
			username: doctor.cccd, // CCCD is the username
			password: doctor.password,
			phone: doctor.phone,
			fullName: doctor.full_name,
			role: 'doctor'
		};
	}
	
	return null;
};

// Helper function to get user by ID
exports.findUserById = (userId) => {
	// Check admin
	if (userId === ADMIN_ACCOUNT.id) {
		return ADMIN_ACCOUNT;
	}
	
	// Check doctors by ID
	const doctors = require('./doctors');
	const doctor = doctors.find(doc => doc.id === userId);
	
	if (doctor) {
		return {
			id: doctor.id,
			username: doctor.cccd,
			password: doctor.password,
			fullName: doctor.full_name,
			role: 'doctor'
		};
	}
	
	return null;
};

// Export admin account for reference
exports.ADMIN_ACCOUNT = ADMIN_ACCOUNT;