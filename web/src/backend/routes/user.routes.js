const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validate.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

router.post(
    '/upload-image',
    authenticate,
    upload.single('file'),
    validateRequest,
    userController.uploadAvatar
);

router.get(
    '/download-image',
    authenticate,
    validateRequest,
    userController.getAvatarUrl
);

router.get(
    '/download-avatar',
    validateRequest,
    userController.downloadAvatar
);

module.exports = router;