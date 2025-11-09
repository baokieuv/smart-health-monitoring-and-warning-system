const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  cccd: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    length: 12
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Nam', 'Nữ', 'Khác'],
    required: true
  },
  address: {
    street: String,
    ward: String,
    district: String,
    city: String,
    fullAddress: String
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  emergencyContactPhone: {
    type: String,
    required: true,
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['normal', 'warning'],
    default: 'normal'
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  familyAccessCode: {
    type: String,
    length: 6,
    // Mã bí mật 6 số 
  },
  // Structured vitals for easy charting
  heartRateHistory: [{
    value: {
      type: Number,
      required: true,
      min: 0,
      max: 300
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  spo2History: [{
    value: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  temperatureHistory: [{
    value: {
      type: Number,
      required: true,
      min: 30,
      max: 45
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
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
patientSchema.index({ fullName: 1 });
patientSchema.index({ status: 1 });

module.exports = mongoose.model('Patient', patientSchema);
