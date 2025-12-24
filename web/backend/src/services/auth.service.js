const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const TokenUtil = require('../utils/token.util');
const tokenStore = require('../utils/tokenStore.util');
const thingsBoardService = require('./thingsboard.service');
const logger = require('../utils/logger.util');
const { 
    NotFoundError, 
    UnauthorizedError, 
    BadRequestError 
} = require('../errors');
const { ROLES, PASSWORD_SALT_ROUNDS } = require('../config/constants');

class AuthService {
    async login(username, password){
        tokenStore.clearExpiredTokens();

        if(!username || !password){
            throw new BadRequestError('Username and password are required');
        }

        const normalizedUsername = username.toLowerCase().trim();
        const user = await userRepository.findByUsernameWithPassword(normalizedUsername);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid credentials');
        }

        // Generate tokens
        const tokens = TokenUtil.generateTokens(user);
        tokenStore.saveRefreshToken(
            tokens.refreshTokenId,
            user._id,
            tokens.refreshTokenExpiresAt
        );

        try{
            const tbCredentials = user.role === ROLES.ADMIN
                ? { type: 'admin' }
                : { type: 'tenant' };

            const tbToken = await thingsBoardService.login(tbCredentials);
            tokenStore.saveThingsBoardToken(
                user._id.toString(),
                tbToken,
                tokens.refreshTokenExpiresAt
            );
            logger.info(`ThingsBoard login successful for user: ${user._id}`);
        }catch (err){
            logger.warn(`ThingsBoard connection failed: ${err.message}`);
        }

        logger.info(`Login successful: ${user._id}`);

        return {
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            },
            tokens
        };
    }

    async refreshToken(refreshToken) {
        tokenStore.clearExpiredTokens();

        if (!refreshToken) {
            throw new BadRequestError('Refresh token is required');
        }

        const payload = TokenUtil.verifyRefreshToken(refreshToken);
        const storedToken = tokenStore.findRefreshToken(payload.tokenId);

        if (!storedToken) {
            throw new UnauthorizedError('Refresh token is invalid or expired');
        }

        const user = await userRepository.findById(payload.id);
        if (!user) {
            tokenStore.deleteRefreshToken(payload.tokenId);
            throw new UnauthorizedError('Account is no longer available');
        }

        // Delete old token and generate new ones
        tokenStore.deleteRefreshToken(payload.tokenId);
        const tokens = TokenUtil.generateTokens(user);
        tokenStore.saveRefreshToken(
            tokens.refreshTokenId,
            user._id,
            tokens.refreshTokenExpiresAt
        );

        logger.info(`Token refreshed successfully: ${user._id}`);

        return {
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            },
            tokens
        };
    }

    async logout(userId, refreshToken) {
        if (refreshToken) {
            try {
                const payload = TokenUtil.verifyRefreshToken(refreshToken);
                tokenStore.deleteRefreshToken(payload.tokenId);
            } catch (err) {
                logger.warn('Failed to decode refresh token during logout:', err.message);
            }
        }

        if (userId) {
            tokenStore.revokeTokensByUser(userId);
            tokenStore.deleteThingsBoardToken(userId);
        }

        logger.info(`Logged out successfully: ${userId}`);
    }

    async changePassword(username, oldPassword, newPassword) {
        if (!username || !oldPassword || !newPassword) {
            throw new BadRequestError('All fields are required');
        }

        const normalizedUsername = username.toLowerCase().trim();
        const user = await userRepository.findByUsernameWithPassword(normalizedUsername);

        if (!user) {
            throw new NotFoundError('User not found');
        }

        const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const hashedPassword = await bcrypt.hash(newPassword, PASSWORD_SALT_ROUNDS);
        await userRepository.updatePassword(user._id, hashedPassword);

        logger.info(`Password updated successfully: ${user._id}`);

        return {
            id: user._id,
            username: user.username
        };
    }
}

module.exports = new AuthService();