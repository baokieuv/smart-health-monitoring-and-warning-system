const tokenStore = require('../utils/token-store');
const { generateTokens, verifyRefreshToken } = require('../utils/token');
const User = require('../models/user.model');
const Patient = require('../models/patient.model');

const THINGSBOARD_URL = "http://localhost:8080";

const buildUserResponse = (user) => ({
	id: user._id,
	username: user.username,
	role: user.role
});

exports.login = async (req, res) => {
	try {
		tokenStore.clearExpiredTokens();
		const username = (req.body.username || '').toLowerCase();
		const password = req.body.password || '';

		if (!username || !password) {
			return res.status(400).json({
				status: 'error',
				message: 'Username and password are required.'
			});
		}

		const normalizedUsername = username.toLowerCase().trim();
		const user = await User.findOne({username: normalizedUsername});

		if (!user || user.password !== password) {
			return res.status(401).json({
				status: 'error',
				message: 'Invalid credentials.'
			});
		}

		const tokens = generateTokens(user);
		tokenStore.saveRefreshToken(tokens.refreshTokenId, user._id, tokens.refreshTokenExpiresAt);

		let tbUsername = "";
		let tbPass = "";

		if(user.role === 'patient'){
			const patient = await Patient.findById(user.patientId)
				.populate({
					path: 'doctorId',
					model: 'User',
					populate: {
						path: 'doctorId',
						model: 'Doctor'
					}
				})
				.exec();

			if (!patient) {
				return res.status(404).json({
					status: "error",
					message: "Patient profile not found."
				});
			}

			if (!patient.doctorId || !patient.doctorId.doctorId) {
				return res.status(404).json({
					status: "error",
					message: "Doctor not assigned to this patient."
				});
			}

			tbUsername = patient.doctorId.doctorId.cccd + "@thingsboard.local";
			tbPass = patient.doctorId.doctorId.cccd;
		}else{
			tbUsername = user.role === 'admin' ? user.username : user.username + "@thingsboard.local";
			tbPass = user.role === 'admin' ? user.password : user.username;
		}

		const payload = {
			username: tbUsername,
			password: tbPass
		}

		const resp = await fetch(`${THINGSBOARD_URL}/api/auth/login`, {
			method: "POST",
			body: JSON.stringify(payload),
			headers: {
				"Content-Type": "application/json"
			}
		});

		if(resp.ok){
			const json = await resp.json();
			console.log(user._id);
			tokenStore.saveThingsBoardToken(user._id.toString(), json.token, tokens.refreshTokenExpiresAt);		

			return res.status(200).json({
				status: 'success',
				message: 'Login successful.',
				data: {
					user: buildUserResponse(user),
					access_token: tokens.accessToken,
					access_token_expires_at: tokens.accessTokenExpiresAt,
					refresh_token: tokens.refreshToken,
					refresh_token_expires_at: tokens.refreshTokenExpiresAt
				}
			});
		}else{
			return res.status(502).json({
				status: "error",
				message: "Bad gateway"
			});
		}
	} catch (error) {
		console.error('Login error:', error);
		return res.status(500).json({
			status: 'error',
			message: 'Unexpected error occurred.'
		});
	}
};

exports.refreshToken = async (req, res) => {
	try {
		tokenStore.clearExpiredTokens();
		const incomingToken = req.body.refresh_token;
		if (!incomingToken) {
			return res.status(400).json({
				status: 'error',
				message: 'Refresh token is required.'
			});
		}

		const payload = verifyRefreshToken(incomingToken);
		const storedToken = tokenStore.findRefreshToken(payload.tokenId);
		if (!storedToken) {
			return res.status(401).json({
				status: 'error',
				message: 'Refresh token is invalid or expired.'
			});
		}

		// Find user by ID (admin or doctor)
		const user = await User.findById(payload.id);
		if (!user) {
			tokenStore.deleteRefreshToken(payload.tokenId);
			return res.status(401).json({
				status: 'error',
				message: 'Account is no longer available.'
			});
		}

		tokenStore.deleteRefreshToken(payload.tokenId);
		const tokens = generateTokens(user);
		tokenStore.saveRefreshToken(tokens.refreshTokenId, user._id, tokens.refreshTokenExpiresAt);

		return res.status(200).json({
			status: 'success',
			message: 'Token refreshed successfully.',
			data: {
				user: buildUserResponse(user),
				access_token: tokens.accessToken,
				access_token_expires_at: tokens.accessTokenExpiresAt,
				refresh_token: tokens.refreshToken,
				refresh_token_expires_at: tokens.refreshTokenExpiresAt
			}
		});
	} catch (error) {
		console.error('Refresh token error:', error);
		const status = error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError' ? 401 : 500;
		return res.status(status).json({
			status: 'error',
			message: status === 401 ? 'Refresh token is invalid or expired.' : 'Unexpected error occurred.'
		});
	}
};

exports.logout = (req, res) => {
	try {
		const { refresh_token: refreshToken } = req.body || {};
		if (refreshToken) {
			try {
				const payload = verifyRefreshToken(refreshToken);
				tokenStore.deleteRefreshToken(payload.tokenId);
			} catch (err) {
				console.warn('Failed to decode refresh token during logout:', err.message);
			}
		}

		if (req.user && req.user.id) {
			tokenStore.revokeTokensByUser(req.user.id);
			tokenStore.deleteThingsBoardToken(req.user.id);
		}

		return res.status(200).json({
			status: 'success',
			message: 'Logged out successfully.'
		});
	} catch (error) {
		console.error('Logout error:', error);
		return res.status(500).json({
			status: 'error',
			message: 'Unexpected error occurred.'
		});
	}
};
