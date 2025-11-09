const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
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

// Virtual: Calculate age from dateOfBirth
doctorSchema.virtual('age').get(function() {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return null;
});

// Virtual: Years of service
doctorSchema.virtual('yearsOfService').get(function() {
  if (this.joinDate) {
    const today = new Date();
    const joinDate = new Date(this.joinDate);
    let years = today.getFullYear() - joinDate.getFullYear();
    const monthDiff = today.getMonth() - joinDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < joinDate.getDate())) {
      years--;
    }
    return years;
  }
  return 0;
});

// Indexes
doctorSchema.index({ userId: 1 });
doctorSchema.index({ email: 1 });
doctorSchema.index({ licenseNumber: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ department: 1 });
doctorSchema.index({ name: 1 });

// Ensure virtuals are included
doctorSchema.set('toJSON', { virtuals: true });
doctorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Doctor', doctorSchema);
