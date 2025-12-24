const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    name:{
        type: String,
        unique: true,
        trim: true
    },
    deviceId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    doctorCCCD: {
        type: String,
        trim: true,
        default: null
    },
    patientCCCD: {
        type: String,
        trim: true,
        default: null
    },   
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
}, {
  timestamps: true
});

// Indexes
// deviceSchema.index({ deviceId: 1 });
deviceSchema.index({ patientCCCD: 1 });
deviceSchema.index({ doctorCCCD: 1 });

module.exports = mongoose.model('Device', deviceSchema);
