const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  parsedData: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
resumeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for efficient querying
resumeSchema.index({ 'parsedData.skills.name': 1 });
resumeSchema.index({ 'parsedData.experience.company': 1 });
resumeSchema.index({ 'parsedData.education.institution': 1 });
resumeSchema.index({ status: 1 });

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume; 