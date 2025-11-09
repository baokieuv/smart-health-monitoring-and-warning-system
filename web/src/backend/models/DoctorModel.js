const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
    // Full name: BS. Nguyễn Văn Minh
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    trim: true
    // Địa chỉ: Số 123, Đường ABC, Quận XYZ
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['Khoa Nội', 'Khoa Ngoại', 'Khoa Nhi', 'Khoa Sản', 'Khoa Chấn thương', 'Khoa Tim mạch'],
    trim: true
    // Khoa làm việc
  },
  position: {
    type: String,
    enum: ['Bác sĩ', 'Trưởng khoa', 'Điều dưỡng'],
    default: 'Bác sĩ'
    // Chức vụ
  },
  specialization: {
    type: String,
    required: true,
    trim: true
    // Chuyên môn: Tim mạch, Thần kinh, Nội khoa, ...
  },
  education: {
    type: String,
    trim: true
    // Học vấn: Bác sĩ Nội khoa - Đại học Y Hà Nội
  },
  experience: {
    type: String,
    trim: true
    // Kinh nghiệm: 15 năm
  },
  joinDate: {
    type: Date,
    default: Date.now
    // Ngày vào làm
  },
  certifications: [{
    name: String,
    issuedBy: String,
    issuedDate: Date,
    expiryDate: Date
  }],
  workingHours: {
    monday: { start: String, end: String },
    tuesday: { start: String, end: String },
    wednesday: { start: String, end: String },
    thursday: { start: String, end: String },
    friday: { start: String, end: String },
    saturday: { start: String, end: String },
    sunday: { start: String, end: String }
  },
  isActive: {
    type: Boolean,
    default: true
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
doctorSchema.index({ userId: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ department: 1 });
doctorSchema.index({ name: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
