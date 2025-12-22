const express = require("express");
const multer = require('multer');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const userController = require('../controllers/user.controller');

const router = express.Router();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        // Pre-validate file type
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// get current patient's details
router.post(
    "/upload-image", 
    authenticate,
    upload.single('file'),
    validateRequest,
    userController.uploadImage);

// download user avatar as file
router.get(
    "/download-avatar",
    validateRequest,
    userController.downloadAvatar);

// get current patient's health info
router.get(
    "/download-image", 
    authenticate,
    validateRequest,
    userController.downloadImage);

module.exports = router;
