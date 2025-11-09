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
    enum: ['admin', 'doctor'],
    required: true,
    default: 'doctor'
    // Role để phân quyền: admin hoặc doctor
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
    // Link đến Doctor document nếu role = 'doctor'
  },
  isActive: {
    type: Boolean,
    default: true
    // Trạng thái tài khoản: true = hoạt động, false = bị khóa
  },
  refreshToken: {
    type: String,
    default: null
    // JWT refresh token để làm mới access token
  },
  passwordChangedAt: {
    type: Date,
    default: null
    // Thời gian đổi mật khẩu gần nhất
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

module.exports = mongoose.model('User', userSchema);
