const bcrypt = require('bcryptjs');
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

		if (!user) {
			return res.status(401).json({
				status: 'error',
				message: 'Invalid credentials.'
			});
		}

		// Compare password using bcrypt
		// const isPasswordValid = await bcrypt.compare(password, user.password);
		
		// if (!isPasswordValid) {
		// 	return res.status(401).json({
		// 		status: 'error',
		// 		message: 'Invalid credentials.'
		// 	});
		// }

		if(user.password !== password){
			return res.status(401).json({
				status: 'error',
				message: 'Invalid credentials.'
			});
		}

		const tokens = generateTokens(user);
		tokenStore.saveRefreshToken(tokens.refreshTokenId, user._id, tokens.refreshTokenExpiresAt);


		let tbUsername = "";
		let tbPass = "";

		if(user.role === 'admin'){
			tbUsername = "sysadmin@thingsboard.org";
			tbPass = "sysadmin";
		}else{
			tbUsername = "tenant@thingsboard.org";
			tbPass = "tenant";
		}

		// Try to connect to ThingsBoard
		try {
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
				tokenStore.saveThingsBoardToken(user._id.toString(), json.token, tokens.refreshTokenExpiresAt);
				console.log('ThingsBoard token saved for user:', user._id);
			} else {
				console.warn('ThingsBoard login failed with status:', resp.status);
			}
		} catch (err) {
			// ThingsBoard connection failed - this is OK, we can still login to our system
			console.warn('ThingsBoard connection failed (service may not be running):', err.message);
			throw err;
		}

		// Return success regardless of ThingsBoard connection status
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
