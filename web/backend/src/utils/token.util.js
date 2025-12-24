const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const accessSecret = process.env.JWT_ACCESS_SECRET || 'secret_access';
const refreshSecret = process.env.JWT_REFRESH_SECRET || 'secret_refresh';
const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

class TokenUtil {
    static generateTokens(user){
        const basePayload = {
            id: user._id.toString(),
            username: user.username,
            role: user.role
        };

        const accessToken = jwt.sign(basePayload, accessSecret, { expiresIn: accessExpiresIn });
        const { exp: accessExp } = jwt.decode(accessToken) || {};

        const refreshTokenId = crypto.randomUUID();
        const refreshPayload = { ...basePayload, tokenId: refreshTokenId, type: 'refresh' };
        const refreshToken = jwt.sign(refreshPayload, refreshSecret, { expiresIn: refreshExpiresIn });
        const { exp: refreshExp } = jwt.decode(refreshToken) || {};

        return {
            accessToken,
            accessTokenExpiresAt: accessExp ? accessExp * 1000 : null,
            refreshToken,
            refreshTokenId,
            refreshTokenExpiresAt: refreshExp ? refreshExp * 1000 : null
        };
    }

    static verifyAccessToken(token) {
        return jwt.verify(token, accessSecret);
    }

    static verifyRefreshToken(token) {
        return jwt.verify(token, refreshSecret);
    }

    static decodeToken(token) {
        return jwt.decode(token);
    }
}

module.exports = TokenUtil;