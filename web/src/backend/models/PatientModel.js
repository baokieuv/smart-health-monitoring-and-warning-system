const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    unique: true
  },
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

// Index
patientSchema.index({ cccd: 1 });
patientSchema.index({ fullName: 1 });
patientSchema.index({ roomId: 1 });
patientSchema.index({ assignedDoctorId: 1 });
patientSchema.index({ status: 1 });
patientSchema.index({ admissionDate: -1 });

// Virtual field: age
patientSchema.virtual('age').get(function() {
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

// Virtual: Latest vitals
patientSchema.virtual('latestHeartRate').get(function() {
  if (this.heartRateHistory && this.heartRateHistory.length > 0) {
    return this.heartRateHistory[this.heartRateHistory.length - 1];
  }
  return null;
});

patientSchema.virtual('latestSpo2').get(function() {
  if (this.spo2History && this.spo2History.length > 0) {
    return this.spo2History[this.spo2History.length - 1];
  }
  return null;
});

patientSchema.virtual('latestTemperature').get(function() {
  if (this.temperatureHistory && this.temperatureHistory.length > 0) {
    return this.temperatureHistory[this.temperatureHistory.length - 1];
  }
  return null;
});

patientSchema.virtual('latestBloodPressure').get(function() {
  if (this.bloodPressureHistory && this.bloodPressureHistory.length > 0) {
    return this.bloodPressureHistory[this.bloodPressureHistory.length - 1];
  }
  return null;
});

// Method: Add vital signs
patientSchema.methods.addVitals = function(vitals) {
  if (vitals.heartRate !== undefined) {
    this.heartRateHistory.push({
      value: vitals.heartRate,
      timestamp: vitals.timestamp || new Date()
    });
  }
  if (vitals.spo2 !== undefined) {
    this.spo2History.push({
      value: vitals.spo2,
      timestamp: vitals.timestamp || new Date()
    });
  }
  if (vitals.temperature !== undefined) {
    this.temperatureHistory.push({
      value: vitals.temperature,
      timestamp: vitals.timestamp || new Date()
    });
  }
  if (vitals.bloodPressureSystolic !== undefined && vitals.bloodPressureDiastolic !== undefined) {
    this.bloodPressureHistory.push({
      systolic: vitals.bloodPressureSystolic,
      diastolic: vitals.bloodPressureDiastolic,
      timestamp: vitals.timestamp || new Date()
    });
  }
  if (vitals.respiratoryRate !== undefined) {
    this.respiratoryRateHistory.push({
      value: vitals.respiratoryRate,
      timestamp: vitals.timestamp || new Date()
    });
  }
  
  // Also add to legacy vitals field
  this.vitals.push({
    heartRate: vitals.heartRate,
    spo2: vitals.spo2,
    temperature: vitals.temperature,
    bloodPressureSystolic: vitals.bloodPressureSystolic,
    bloodPressureDiastolic: vitals.bloodPressureDiastolic,
    respiratoryRate: vitals.respiratoryRate,
    timestamp: vitals.timestamp || new Date()
  });
  
  return this.save();
};

// Method: Get vitals for chart (last N entries)
patientSchema.methods.getChartData = function(limit = 20) {
  const getLastN = (arr) => arr.slice(-limit);
  
  return {
    heartRate: getLastN(this.heartRateHistory || []).map(item => ({
      time: item.timestamp,
      value: item.value
    })),
    spo2: getLastN(this.spo2History || []).map(item => ({
      time: item.timestamp,
      value: item.value
    })),
    temperature: getLastN(this.temperatureHistory || []).map(item => ({
      time: item.timestamp,
      value: item.value
    })),
    bloodPressure: getLastN(this.bloodPressureHistory || []).map(item => ({
      time: item.timestamp,
      systolic: item.systolic,
      diastolic: item.diastolic
    })),
    respiratoryRate: getLastN(this.respiratoryRateHistory || []).map(item => ({
      time: item.timestamp,
      value: item.value
    }))
  };
};

// Ensure virtuals are included when converting to JSON
patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Patient', patientSchema);
