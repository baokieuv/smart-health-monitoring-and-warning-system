const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    // VD: A101, B205, ICU-01
  },
  roomName: {
    type: String,
    trim: true
  },
  floor: {
    type: Number,
    required: true,
    min: 0
  },
  building: {
    type: String,
    trim: true,
    // Tòa nhà: A, B, C, ...
  },
  roomType: {
    type: String,
    enum: ['standard', 'vip', 'icu', 'emergency', 'operating'],
    required: true,
    default: 'standard'
  },
  department: {
    type: String,
    trim: true,
    // Khoa: Tim mạch, Nội khoa, Ngoại khoa, ...
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
    // Số giường tối đa
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
  equipment: [{
    name: String,
    quantity: Number,
    status: {
      type: String,
      enum: ['working', 'maintenance', 'broken'],
      default: 'working'
    }
  }],
  features: [{
    type: String,
    // VD: Điều hòa, TV, Tủ lạnh, Phòng tắm riêng, ...
  }],
  pricePerDay: {
    type: Number,
    min: 0,
    // Giá phòng/ngày (VNĐ)
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'reserved'],
    default: 'available'
  },
  assignedNurses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notes: {
    type: String,
    trim: true
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

// Index
roomSchema.index({ roomCode: 1 });
roomSchema.index({ floor: 1 });
roomSchema.index({ building: 1 });
roomSchema.index({ roomType: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ department: 1 });

// Virtual: availableBeds
roomSchema.virtual('availableBeds').get(function() {
  return this.capacity - this.currentOccupancy;
});

// Virtual: occupancyRate
roomSchema.virtual('occupancyRate').get(function() {
  if (this.capacity === 0) return 0;
  return ((this.currentOccupancy / this.capacity) * 100).toFixed(2);
});

// Ensure virtuals are included
roomSchema.set('toJSON', { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

// Pre-save middleware to update status based on occupancy
roomSchema.pre('save', function(next) {
  if (this.currentOccupancy >= this.capacity) {
    this.status = 'occupied';
  } else if (this.currentOccupancy === 0 && this.status === 'occupied') {
    this.status = 'available';
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);
