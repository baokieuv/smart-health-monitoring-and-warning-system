const userService = require('../services/user.service');
const ResponseUtil = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler.util');
const { BadRequestError } = require('../errors');

class UserController {
    uploadAvatar = asyncHandler(async (req, res) => {
        const url = await userService.uploadAvatar(req.user.id, req.file);
        
        ResponseUtil.success(res, { url }, 'Avatar uploaded successfully');
    });

    getAvatarUrl = asyncHandler(async (req, res) => {
        const url = await userService.getAvatarUrl(req.user.id);
        
        ResponseUtil.success(res, url, 'Avatar URL retrieved successfully');
    });

    downloadAvatar = asyncHandler(async (req, res) => {
        let token = req.query.token || req.headers.authorization?.substring(7);
        
        if (!token) {
            throw new BadRequestError('Authentication required');
        }

        const result = await userService.downloadAvatar(token);
        
        // Stream the image
        const https = require('https');
        const filename = `avatar_${result.username}_${Date.now()}.jpg`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'image/jpeg');

        https.get(result.imageUrl, (imageStream) => {
            imageStream.pipe(res);
        }).on('error', (err) => {
            throw new Error('Failed to download avatar');
        });
    });
}

module.exports = new UserController();