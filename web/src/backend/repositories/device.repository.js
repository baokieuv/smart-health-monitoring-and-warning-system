const BaseRepository = require('./base.repository');
const Device = require('../models/device.model');

class DeviceRepository extends BaseRepository {
    constructor() {
        super(Device);
    }

    async findByDeviceId(deviceId) {
        return this.findOne({ deviceId });
    }

    async findByPatientId(patientId) {
        return this.findOne({ patientId });
    }

    async findByDoctorId(doctorId) {
        return this.find({ doctorId });
    }

    async getDevicesWithDetails(page, limit) {
        return this.paginate({}, page, limit, {
            populate: [
                {
                    path: 'doctorId',
                    select: '_id full_name cccd phone specialization'
                },
                {
                    path: 'patientId',
                    select: '_id full_name cccd phone room'
                }
            ],
            sort: { createdAt: -1 }
        });
    }

    async deleteByDeviceId(deviceId) {
        return this.deleteOne({ deviceId });
    }

    async deleteByPatientId(patientId) {
        return this.deleteOne({ patientId });
    }

    async deleteByDoctorId(doctorId) {
        return this.deleteMany({ doctorId });
    }
}

module.exports = new DeviceRepository();