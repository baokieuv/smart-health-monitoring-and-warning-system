const sharp = require('sharp');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3.config');
const userRepository = require('../repositories/user.repository');
const logger = require('../utils/logger.util');
const { NotFoundError, BadRequestError } = require('../errors');

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;

class UserService {
    async uploadAvatar(userId, file) {
        if (!file) {
            throw new BadRequestError('No file uploaded');
        }

        if (!file.mimetype.startsWith('image/')) {
            throw new BadRequestError('File is not an image');
        }

        const user = await userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        // Process image
        const fileBuffer = await sharp(file.buffer)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toBuffer();

        const filename = `avt_${user.username}.jpg`;

        // Upload to S3
        const params = {
            Bucket: bucketName,
            Key: filename,
            Body: fileBuffer,
            ContentType: 'image/jpeg'
        };

        await s3Client.send(new PutObjectCommand(params));

        // Generate URL and update user
        const url = `https://${bucketName}.s3.${region}.amazonaws.com/${filename}`;
        await userRepository.updateImage(userId, url);

        logger.info(`Avatar uploaded for user: ${userId}`);
        return url;
    }

    async getAvatarUrl(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (!user.imageUrl) {
            throw new BadRequestError("User doesn't have avatar");
        }

        return user.imageUrl;
    }

    async downloadAvatar(token) {
        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_ACCESS_SECRET || 'secret_access';
        
        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            throw new BadRequestError('Invalid or expired token');
        }

        const user = await userRepository.findById(decoded.id);
        if (!user) {
            throw new NotFoundError('User not found');
        }

        if (!user.imageUrl) {
            throw new BadRequestError("User doesn't have avatar");
        }

        return {
            imageUrl: user.imageUrl,
            username: user.username
        };
    }
}

module.exports = new UserService();