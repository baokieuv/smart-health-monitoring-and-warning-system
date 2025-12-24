const BaseRepository = require('./base.repository');
const User = require('../models/user.model');

class UserRepository extends BaseRepository {
    constructor(){
        super(User);
    }

    async findByUsername(username){
        return this.findOne({ username: username.toLowerCase().trim() });
    }

    async findByUsernameWithPassword(username) {
        return this.model.findOne({ 
            username: username.toLowerCase().trim() 
        }).select('+password');
    }

    async existsByUsername(username) {
        return this.exists({ username: username.toLowerCase().trim() });
    }

    async updatePassword(userId, hashedPassword) {
        return this.updateById(userId, { password: hashedPassword });
    }

    async updateImage(userId, imageUrl) {
        return this.updateById(userId, { imageUrl });
    }
}

module.exports = new UserRepository();