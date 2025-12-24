const BaseRepository = require('./base.repository');
const Patient = require('../models/patient.model');

class PatientRepository extends BaseRepository {
    constructor() {
        super(Patient);
    }

    async findByCCCD(cccd) {
        return this.findOne({ cccd });
    }

    async findByUserId(userId) {
        return this.findOne({ userId });
    }

    async findByDeviceId(deviceId) {
        return this.findOne({ deviceId });
    }

    async existsByCCCD(cccd) {
        return this.exists({ cccd });
    }

    async searchPatients(searchTerm, page, limit) {
        const filter = searchTerm 
            ? { full_name: new RegExp(searchTerm, 'i') }
            : {};

        return this.paginate(filter, page, limit, {
            sort: { createdAt: -1 }
        });
    }

    async updateDeviceId(patientId, deviceId) {
        return this.updateById(patientId, { deviceId });
    }

    async clearDeviceId(patientId) {
        return this.updateById(patientId, { deviceId: null });
    }

    async findPatientsByDoctor(doctorId, searchTerm, page, limit) {
        const filter = { doctorId };

        if (searchTerm) {
            filter.full_name = new RegExp(searchTerm, 'i');
        }

        return this.paginate(filter, page, limit, {
            sort: { createdAt: -1 }
        });
    }
}

module.exports = new PatientRepository();