const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { validateRequest } = require('../middlewares/validate.middleware');

const router = express.Router();

router.post('/alarm', validateRequest, notificationController.handleAlarm);
router.post('/test-alarm', validateRequest, notificationController.testAlarm);

module.exports = router;