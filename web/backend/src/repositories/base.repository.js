class BaseRepository {
    constructor(model){
        this.model = model;
    }

    async findById(id, select = null){
        const query = this.model.findById(id);
        if(select) query.select(select);
        return query.lean();
    }

    async findOne(filter, select = null) {
        const query = this.model.findOne(filter);
        if (select) query.select(select);
        return query.lean();
    }

    async find(filter = {}, options = {}) {
        const { select, sort, skip, limit, populate } = options;
        
        const query = this.model.find(filter);
        
        if (select) query.select(select);
        if (sort) query.sort(sort);
        if (skip) query.skip(skip);
        if (limit) query.limit(limit);
        if (populate) query.populate(populate);
        
        return query.lean();
    }

    async create(data){
        return this.model.create(data);
    }

    async updateById(id, data, options = { new: true, runValidators: true }) {
        return this.model.findByIdAndUpdate(id, { $set: data }, options);
    }

    async updateOne(filter, data, options = { new: true, runValidators: true }) {
        return this.model.findOneAndUpdate(filter, { $set: data }, options);
    }

    async deleteById(id) {
        return this.model.findByIdAndDelete(id);
    }

    async deleteOne(filter) {
        return this.model.findOneAndDelete(filter);
    }

    async deleteMany(filter) {
        return this.model.deleteMany(filter);
    }

    async count(filter = {}) {
        return this.model.countDocuments(filter);
    }

    async exists(filter) {
        return this.model.exists(filter);
    }

    async paginate(filter = {}, page = 1, limit = 10, options = {}) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.find(filter, { ...options, skip, limit }),
            this.count(filter)
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1
        };
    }
}

module.exports = BaseRepository;