// const fetch = require('node-fetch');
const logger = require('../utils/logger.util');
const { THINGSBOARD, DEVICE_KEYS } = require('../config/constants');
const { ServiceUnavailableError, BadRequestError } = require('../errors');

class ThingsBoardService {
    constructor(){
        this.baseUrl = THINGSBOARD.URL;
    }

    async login(creadentials){
        const payload = creadentials.type === 'admin' ? THINGSBOARD.ADMIN : THINGSBOARD.TENANT;

        const response = await fetch(`${this.baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: payload.USERNAME,
                password: payload.PASSWORD
            })
        });

        if (!response.ok) {
            throw new ServiceUnavailableError('ThingsBoard login failed');
        }

        const data = await response.json();
        return data.token;
    }

    async getTelemetry(deviceId, token, keys = DEVICE_KEYS.TELEMETRY){
        const keysParam = keys.join(',');
        const response = await fetch(`${this.baseUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${keysParam}`, {
            method: 'GET',
            headers: { 'X-Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new ServiceUnavailableError('Failed to fetch telemetry data');
        }

        return response.json();
    }

    async getAttributes(deviceId, token, keys = DEVICE_KEYS.ATTRIBUTES) {
        const keysParam = keys.join(',');
        const response = await fetch(
            `${this.baseUrl}/api/plugins/telemetry/DEVICE/${deviceId}/values/attributes?keys=${keysParam}`,
            {
                method: 'GET',
                headers: { 'X-Authorization': `Bearer ${token}` }
            }
        );

        if (!response.ok) {
            throw new ServiceUnavailableError('Failed to fetch device attributes');
        }

        return response.json();
    }

    async getDevices(token, pageSize = 1000, page = 0) {
        const response = await fetch(
            `${this.baseUrl}/api/tenant/devices?pageSize=${pageSize}&page=${page}`,
            {
                method: 'GET',
                headers: { 'X-Authorization': `Bearer ${token}` }
            }
        );

        if (!response.ok) {
            throw new ServiceUnavailableError('Failed to fetch devices');
        }

        const data = await response.json();
        return data.data || [];
    }

    async deleteDevice(deviceId, token) {
        const response = await fetch(
            `${this.baseUrl}/api/device/${deviceId}`,
            {
                method: 'DELETE',
                headers: { 'X-Authorization': `Bearer ${token}` }
            }
        );

        if (!response.ok) {
            throw new ServiceUnavailableError('Failed to delete device');
        }

        logger.info(`Device ${deviceId} deleted from ThingsBoard`);
        return true;
    }

    async findDeviceByAttributes(patientCCCD, token) {
        const devices = await this.getDevices(token);

        for (const device of devices) {
            try {
                const attributes = await this.getAttributes(device.id.id, token);
                const patientAttr = attributes.find(attr => attr.key === 'patient');
                
                if (!patientAttr) continue;

                const normalizedValue = String(patientAttr.value).padStart(12, '0');
                
                if (normalizedValue === patientCCCD) {
                    logger.info(`Device found: ${device.id.id} for CCCD ${patientCCCD}`);
                    return {
                        deviceId: device.id.id,
                        deviceName: device.name,
                        attributes
                    };
                }
            } catch (err) {
                logger.warn(`Failed to check device ${device.id.id}:`, err.message);
            }
        }

        return null;
    }

    parseTelemetryData(telemetryData) {
        const healthInfo = {};

        for (const [key, values] of Object.entries(telemetryData)) {
            const latest = Array.isArray(values) && values.length > 0
                ? values[values.length - 1].value
                : null;
            healthInfo[key] = latest;
        }

        return {
            heart_rate: healthInfo.heart_rate ? parseFloat(healthInfo.heart_rate) : null,
            SpO2: healthInfo.SpO2 ? parseFloat(healthInfo.SpO2) : null,
            temperature: healthInfo.temperature ? parseFloat(healthInfo.temperature) : null,
            last_measurement: new Date().toISOString(),
            alarm_status: healthInfo.alarm || null
        };
    }
}

module.exports = new ThingsBoardService();