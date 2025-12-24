const notificationService = require('../services/notification.service');
const ResponseUtil = require('../utils/response.util');
const asyncHandler = require('../utils/asyncHandler.util');

class NotificationController {
    handleAlarm = asyncHandler(async (req, res) => {
        const alarmPayload = req.body;

        const result = await notificationService.processAlarm(alarmPayload);
        
        ResponseUtil.success(res, result, 'Alarm processed successfully');
    });

    testAlarm = asyncHandler(async (req, res) => {
        const alarmPayload = {
            deviceId: req.body.deviceId,
            alarmType: req.body.alarmType || 'TEST_ALARM',
            severity: req.body.severity || 'INFO',
            data: req.body.data || {}
        };

        const result = await notificationService.processAlarm(alarmPayload);
        
        ResponseUtil.success(res, result, 'Test alarm processed successfully');
    });
}

module.exports = new NotificationController();