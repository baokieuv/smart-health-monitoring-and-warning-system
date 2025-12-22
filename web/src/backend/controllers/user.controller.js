const User = require("../models/user.model");
const sharp = require('sharp');
const s3Client = require("../config/s3.config");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;

// POST /api/v1/user/upload-image -> upload user avatar
exports.uploadImage = async (req, res) => {

    try{
        if (!req.file) {
            return res.status(400).json({
                status: "error",
                message: "No file uploaded."
            });
        }

       if (!req.file.mimetype.startsWith("image/")) {
            return res.status(400).json({
                status: "error",
                message: "File is not an image."
            });
        }

        const user = await User.findById(req.user.id);
        if(!user){
            return res.status(404).json({
                status: "error",
                message: "User not found."
            });
        }

        const fileBuffer = await sharp(req.file.buffer)
            .toFormat('jpeg')
            .jpeg({quality: 90})
            .toBuffer();

        const filename = `avt_${user.username}.jpg`;

        const params = {
            Bucket: bucketName,
            Key: filename,
            Body: fileBuffer,
            ContentType: 'image/jpeg'
        };

        await s3Client.send(new PutObjectCommand(params));

        const url = `https://${bucketName}.s3.${region}.amazonaws.com/${filename}`;
        await User.updateOne(
            { _id: user._id },
            { imageUrl: url }
        );

        return res.status(200).json({
            status: "success",
            message: "Upload avatar successfully.",
            url: url
        });

    }
    catch(err){
		console.error("Get patient info error:", err);
		return res.status(500).json({
			status: "error",
			message: "Unexpected error occurred.",
		});
    }

};

// GET /api/v1/user/download-image -> get user avatar URL
exports.downloadImage = async (req, res) => {
    try{
        const user = await User.findById(req.user.id);

        if(!user){
            return res.status(404).json({
                status: "error",
                message: "User not found."
            });
        }

        if(!user.imageUrl){
            return res.status(400).json({
                status: "error",
                message: "User doesn't have avatar."
            });
        }

        return res.status(200).json({
            status: "success",
            message: "Image url retrieved successfully.",
            data: user.imageUrl
        });
    }catch(err){
		console.error("Get patient info error:", err);
		return res.status(500).json({
			status: "error",
			message: "Unexpected error occurred.",
		});
    }
};

// GET /api/v1/user/download-avatar -> download user avatar file
exports.downloadAvatar = async (req, res) => {
    try{
        // Get token from query string or header
        let token = req.query.token;
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "Authentication required."
            });
        }

        // Verify token manually
        const jwt = require('jsonwebtoken');
        const jwtSecret = process.env.JWT_ACCESS_SECRET || 'secret_access';
        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
        } catch (err) {
            return res.status(401).json({
                status: "error",
                message: "Invalid or expired token."
            });
        }

        const user = await User.findById(decoded.id);

        if(!user){
            return res.status(404).json({
                status: "error",
                message: "User not found."
            });
        }

        if(!user.imageUrl){
            return res.status(400).json({
                status: "error",
                message: "User doesn't have avatar."
            });
        }

        // Fetch image from S3 URL
        const https = require('https');
        const filename = `avatar_${user.username}_${Date.now()}.jpg`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'image/jpeg');

        https.get(user.imageUrl, (imageStream) => {
            imageStream.pipe(res);
        }).on('error', (err) => {
            console.error("Download avatar error:", err);
            return res.status(500).json({
                status: "error",
                message: "Failed to download avatar."
            });
        });

    }catch(err){
		console.error("Download avatar error:", err);
		return res.status(500).json({
			status: "error",
			message: "Unexpected error occurred.",
		});
    }
};
