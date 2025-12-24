const BaseRepository = require('./base.repository');
const Doctor = require('../models/doctor.model');

class DoctorRepository extends BaseRepository {
    constructor() {
        super(Doctor);
    }

    async findByCCCD(cccd) {
        return this.findOne({ cccd });
    }

    async findByUserId(userId) {
        return this.findOne({ userId });
    }

    async existsByCCCD(cccd) {
        return this.exists({ cccd });
    }

    async searchDoctors(searchTerm, specialization, page, limit) {
        const filter = {};

        if (searchTerm) {
            filter.full_name = new RegExp(searchTerm, 'i');
        }

        if (specialization) {
            filter.specialization = new RegExp(specialization, 'i');
        }

        return this.paginate(filter, page, limit, {
            sort: { createdAt: -1 }
        });
    }

    async getDoctorsList() {
        return this.find({}, {
            select: 'userId full_name email specialization',
            sort: { full_name: 1 }
        });
    }
}

module.exports = new DoctorRepository();