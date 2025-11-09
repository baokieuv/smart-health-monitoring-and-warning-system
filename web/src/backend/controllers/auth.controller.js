const users = require('../data/users');
const tokenStore = require('../utils/token-store');
const { generateTokens, verifyRefreshToken } = require('../utils/token');
const { findUserByUsername, findUserById } = require('../data/users')


const THINGSBOARD_URL = "http://localhost:8080";

const buildUserResponse = (user) => ({
	id: user.id,
	username: user.username,
	full_name: user.fullName,
	role: user.role
});

exports.login = async (req, res) => {
	try {
		tokenStore.clearExpiredTokens();
		const username = (req.body.username || '').toLowerCase();
		const password = req.body.password || '';

		//const user = users.find((candidate) => candidate.email === email);
		if (!username || !password) {
			return res.status(400).json({
				status: 'error',
				message: 'Username and password are required.'
			});
		}

		// Find user (admin by email or doctor by cccd)
		const user = findUserByUsername(username);

		if (!user || user.password !== password) {
			return res.status(401).json({
				status: 'error',
				message: 'Invalid credentials.'
			});
		}

		const tokens = generateTokens(user);
		tokenStore.saveRefreshToken(tokens.refreshTokenId, user.id, tokens.refreshTokenExpiresAt);

		const tbUsername = user.role === 'admin' ? user.username : user.username + "@thingsboard.local";
		const tbPass = user.role === 'admin' ? user.password : user.phone;
		// const tbPass = user.password;

		// const formData = new FormData();
		// formData.append("username", user.username);
		// formData.append("password", user.password);
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

		console.log(tbUsername)
		console.log(user.password)
		console.log(resp.status);
		if(resp.ok){
			const json = await resp.json();
			tokenStore.saveThingsBoardToken(user.id, json.token, tokens.refreshTokenExpiresAt);		

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

exports.refreshToken = (req, res) => {
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

		//const user = users.find((candidate) => candidate.id === payload.sub);
		// Find user by ID (admin or doctor)
		const user = findUserById(payload.sub);
		if (!user) {
			tokenStore.deleteRefreshToken(payload.tokenId);
			return res.status(401).json({
				status: 'error',
				message: 'Account is no longer available.'
			});
		}

		tokenStore.deleteRefreshToken(payload.tokenId);
		const tokens = generateTokens(user);
		tokenStore.saveRefreshToken(tokens.refreshTokenId, user.id, tokens.refreshTokenExpiresAt);

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
