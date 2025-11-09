const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  noteType: {
    type: String,
    enum: ['diagnosis', 'treatment', 'progress', 'medication', 'observation', 'discharge', 'general'],
    default: 'general',
    index: true
    // diagnosis: Chẩn đoán
    // treatment: Điều trị
    // progress: Tiến triển
    // medication: Ghi chú về thuốc
    // observation: Quan sát
    // discharge: Xuất viện
    // general: Ghi chú chung
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
    // VD: tim mạch, huyết áp, đau ngực, ...
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String, // image, pdf, document
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  vitalsSnapshot: {
    // Chụp lại chỉ số sinh hiệu tại thời điểm ghi chú
    heartRate: Number,
    spo2: Number,
    temperature: Number,
    bloodPressureSystolic: Number,
    bloodPressureDiastolic: Number,
    respiratoryRate: Number
  },
  isPrivate: {
    type: Boolean,
    default: false
    // Nếu true, chỉ doctor tạo mới xem được
  },
  isPinned: {
    type: Boolean,
    default: false
    // Ghim ghi chú quan trọng lên đầu
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active',
    index: true
  },
  editHistory: [{
    editedAt: {
      type: Date,
      default: Date.now
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    previousContent: String
  }],
  relatedNotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note'
    // Liên kết với các ghi chú khác
  }],
  reminders: [{
    reminderDate: Date,
    reminderText: String,
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
noteSchema.index({ patientId: 1, createdAt: -1 });
noteSchema.index({ doctorId: 1, createdAt: -1 });
noteSchema.index({ patientId: 1, noteType: 1 });
noteSchema.index({ patientId: 1, isPinned: -1, createdAt: -1 });
noteSchema.index({ status: 1, createdAt: -1 });

// Text index for searching
noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Virtual: Doctor info
noteSchema.virtual('doctor', {
  ref: 'Doctor',
  localField: 'doctorId',
  foreignField: '_id',
  justOne: true
});

// Virtual: Patient info
noteSchema.virtual('patient', {
  ref: 'Patient',
  localField: 'patientId',
  foreignField: '_id',
  justOne: true
});

// Method: Add edit history before updating
noteSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.content || update.$set?.content) {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
      const editEntry = {
        editedAt: new Date(),
        editedBy: update.doctorId || update.$set?.doctorId,
        previousContent: docToUpdate.content
      };
      
      if (!update.$push) update.$push = {};
      update.$push.editHistory = editEntry;
    }
  }
  next();
});

// Static method: Get notes by patient with filters
noteSchema.statics.getPatientNotes = function(patientId, filters = {}) {
  const query = { patientId, status: 'active' };
  
  if (filters.noteType) query.noteType = filters.noteType;
  if (filters.doctorId) query.doctorId = filters.doctorId;
  if (filters.priority) query.priority = filters.priority;
  if (filters.isPinned !== undefined) query.isPinned = filters.isPinned;
  
  return this.find(query)
    .populate('doctorId', 'fullName specialization')
    .sort({ isPinned: -1, createdAt: -1 });
};

// Static method: Search notes
noteSchema.statics.searchNotes = function(searchText, patientId = null) {
  const query = {
    $text: { $search: searchText },
    status: 'active'
  };
  
  if (patientId) query.patientId = patientId;
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .populate('doctorId', 'fullName specialization')
    .populate('patientId', 'fullName cccd');
};

// Static method: Get notes by type
noteSchema.statics.getNotesByType = function(patientId, noteType) {
  return this.find({
    patientId,
    noteType,
    status: 'active'
  })
    .populate('doctorId', 'fullName specialization')
    .sort({ createdAt: -1 });
};

// Method: Archive note (soft delete)
noteSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Method: Pin/Unpin note
noteSchema.methods.togglePin = function() {
  this.isPinned = !this.isPinned;
  return this.save();
};

// Ensure virtuals are included
noteSchema.set('toJSON', { virtuals: true });
noteSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Note', noteSchema);
