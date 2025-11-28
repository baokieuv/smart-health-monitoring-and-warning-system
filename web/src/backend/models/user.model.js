const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
    // Username để đăng nhập
  },
  password: {
    type: String,
    required: true,
    minlength: 6
    // Password đã được hash bằng bcrypt
  },
  role: {
    type: String,
    enum: ['admin', 'doctor', 'patient'],
    required: true,
    default: 'patient'
    // Role để phân quyền: admin hoặc doctor hoặc patient
  },
}, {
  timestamps: true
});

// Indexes
// userSchema.index({ username: 1 });

module.exports = mongoose.model('User', userSchema);
