const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
    // Mã phòng: A301, B205, C102
    // Định dạng: [Tòa][Tầng][Số phòng]
  },
  building: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D'],
    trim: true
    // Tòa nhà: A, B, C, D
  },
  floor: {
    type: Number,
    required: true,
    min: 1,
    max: 20
    // Tầng: 1-20
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 2
    // Sức chứa (số giường): 1-10
  },
  description: {
    type: String,
    trim: true
    // Mô tả về phòng
  },
  currentOccupancy: {
    type: Number,
    default: 0,
    min: 0
    // Số giường đang sử dụng
  },
  beds: [{
    bedNumber: {
      type: String,
      required: true
    },
    isOccupied: {
      type: Boolean,
      default: false
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      default: null
    }
  }],
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'full'],
    default: 'available'
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
roomSchema.index({ building: 1 });
roomSchema.index({ floor: 1 });
roomSchema.index({ status: 1 });

module.exports = mongoose.model('Room', roomSchema);
