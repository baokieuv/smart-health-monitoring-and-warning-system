const deviceRepository = require('../repositories/device.repository');
const logger = require('../utils/logger.util');

class DeviceService {
    async getDevices(page, limit) {
        const result = await deviceRepository.getDevicesWithDetails(page, limit);

        // Format devices
        const formattedDevices = result.data.map(device => ({
            device_id: device._id,
            device_name: device.name,
            thingsboard_device_id: device.deviceId,
            doctor: device.doctorId ? {
                id: device.doctorId._id,
                name: device.doctorId.full_name,
                cccd: device.doctorId.cccd,
                phone: device.doctorId.phone,
                specialization: device.doctorId.specialization
            } : null,
            patient: device.patientId ? {
                id: device.patientId._id,
                name: device.patientId.full_name,
                cccd: device.patientId.cccd,
                phone: device.patientId.phone,
                room: device.patientId.room
            } : null
        }));

        logger.info('Devices retrieved successfully');
        return {
            ...result,
            data: formattedDevices
        };
    }
}

module.exports = new DeviceService();