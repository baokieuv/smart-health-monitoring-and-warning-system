const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
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
    trim: true
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  birthday: {
    type: Date,
    required: true
  },
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  specialization: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
// doctorSchema.index({ userId: 1 });
// doctorSchema.index({ cccd: 1 });
doctorSchema.index({ full_name: 1 });
// doctorSchema.index({ name: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
