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

    async searchPatients({ doctorId, search }, page, limit) {
        const filter = { doctorId };
        if(search) {
            filter.full_name = {
                $regex: search,
                $options: 'i'
            }
        }
        // const filter = searchTerm 
        //     ? { full_name: new RegExp(searchTerm, 'i') }
        //     : {};

        return this.paginate(filter, page, limit, {
            sort: { createdAt: -1 },
            populate: {
                path: 'doctorId',
                select: 'full_name specialization'
            }
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