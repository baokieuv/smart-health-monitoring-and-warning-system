const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  cccd: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 12,
    maxlength: 12
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  birthday: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  room: {
    type: String,
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
patientSchema.index({ doctorId: 1 });
// patientSchema.index({ cccd: 1 });

// patientSchema.index({ status: 1 });

module.exports = mongoose.model('Patient', patientSchema);
