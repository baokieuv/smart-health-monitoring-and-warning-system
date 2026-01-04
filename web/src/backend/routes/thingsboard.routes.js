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
            alarmType: req.body.alarmType || 'heart_rate_high',
            severity: req.body.severity || 'CRITICAL',
            data: req.body.data || {
                heartRate: 110,
                spo2: 95,
                temperature: 37.5
            },
            timestamp: req.body.timestamp || new Date().toISOString().replace('T', ' ').substring(0, 19),
            level: req.body.level || 'info',
            message: req.body.message || 'Test alarm'
        };

        const result = await processAlarm(alarmPayload);

        return res.status(200).json({
            status: 'success',
            message: 'Test alarm processed',
            result,
            payload: alarmPayload
        });
    } catch (error) {
        console.error('Test alarm error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to process test alarm',
            error: error.message
        });
    }
});

module.exports = router;
