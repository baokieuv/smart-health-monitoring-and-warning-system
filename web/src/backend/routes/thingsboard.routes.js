const express = require('express');
const router = express.Router();
const { processAlarm } = require('../services/notification.service');

/**
 * POST /api/v1/thingsboard/alarm
 * Webhook endpoint for ThingsBoard to send alarm notifications
 */
router.post('/alarm', async (req, res) => {
    try {
        console.log('Received alarm from ThingsBoard:', req.body);

        const alarmPayload = req.body;

        // Validate payload
        if (!alarmPayload.deviceId || !alarmPayload.alarmType) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid alarm payload'
            });
        }

        // Process alarm (send email)
        const result = await processAlarm(alarmPayload);

        return res.status(200).json({
            status: 'success',
            message: 'Alarm processed',
            result
        });
    } catch (error) {
        console.error('ThingsBoard alarm webhook error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to process alarm'
        });
    }
});

/**
 * POST /api/v1/thingsboard/test-alarm
 * Test endpoint to simulate alarm
 */
router.post('/test-alarm', async (req, res) => {
    try {
        console.log('Test alarm triggered:', req.body);

        const alarmPayload = {
            deviceId: req.body.deviceId,
            alarmType: req.body.alarmType || 'TEST_ALARM',
            severity: req.body.severity || 'INFO',
            data: req.body.data || {}
        };

        const result = await processAlarm(alarmPayload);

        return res.status(200).json({
            status: 'success',
            message: 'Test alarm processed',
            result
        });
    } catch (error) {
        console.error('Test alarm error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to process test alarm'
        });
    }
});

module.exports = router;
