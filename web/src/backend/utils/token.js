const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const accessSecret = process.env.JWT_ACCESS_SECRET || 'secret_access';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'secret_refresh';
const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const signJwt = (payload, secret, expiresIn) => jwt.sign(payload, secret, { expiresIn });

exports.generateTokens = (user) => {
	const basePayload = {
		sub: user.id,
		username: user.username,
		role: user.role
	};

	const accessToken = signJwt(basePayload, accessSecret, accessExpiresIn);
	const { exp: accessExp } = jwt.decode(accessToken) || {};

	const refreshTokenId = crypto.randomUUID();
	const refreshPayload = { ...basePayload, tokenId: refreshTokenId, type: 'refresh' };
	const refreshToken = signJwt(refreshPayload, refreshSecret, refreshExpiresIn);
	const { exp: refreshExp } = jwt.decode(refreshToken) || {};

	return {
		accessToken,
		accessTokenExpiresAt: accessExp ? accessExp * 1000 : null,
		refreshToken,
		refreshTokenId,
		refreshTokenExpiresAt: refreshExp ? refreshExp * 1000 : null
	};
};

exports.verifyAccessToken = (token) => jwt.verify(token, accessSecret);

exports.verifyRefreshToken = (token) => jwt.verify(token, refreshSecret);
