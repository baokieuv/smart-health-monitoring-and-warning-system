const authService = require('../services/auth.service');
const ResponseUtil = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler.util');
const validator = require('../utils/validator.util');

class AuthController {
    login = asyncHandler(async (req, res) => {
        const { username, password } = req.body;
        
        const result = await authService.login(username, password);
        
        ResponseUtil.success(res, {
            user: result.user,
            access_token: result.tokens.accessToken,
            access_token_expires_at: result.tokens.accessTokenExpiresAt,
            refresh_token: result.tokens.refreshToken,
            refresh_token_expires_at: result.tokens.refreshTokenExpiresAt
        }, 'Login successful');
    });

    refreshToken = asyncHandler(async (req, res) => {
        const { refresh_token } = req.body;
        
        const result = await authService.refreshToken(refresh_token);
        
        ResponseUtil.success(res, {
            user: result.user,
            access_token: result.tokens.accessToken,
            access_token_expires_at: result.tokens.accessTokenExpiresAt,
            refresh_token: result.tokens.refreshToken,
            refresh_token_expires_at: result.tokens.refreshTokenExpiresAt
        }, 'Token refreshed successfully');
    });

    logout = asyncHandler(async (req, res) => {
        const { refresh_token } = req.body;
        
        await authService.logout(req.user.id, refresh_token);
        
        ResponseUtil.success(res, null, 'Logged out successfully');
    });

    changePassword = asyncHandler(async (req, res) => {
        const { username, oldPassword, newPassword } = req.body;
        
        const sanitizedData = {
            username: validator.sanitizeInput(username),
            oldPassword: validator.sanitizeInput(oldPassword),
            newPassword: validator.sanitizeInput(newPassword)
        };
        
        const result = await authService.changePassword(
            sanitizedData.username,
            sanitizedData.oldPassword,
            sanitizedData.newPassword
        );
        
        ResponseUtil.success(res, result, 'Password updated successfully');
    });
}

module.exports = new AuthController();