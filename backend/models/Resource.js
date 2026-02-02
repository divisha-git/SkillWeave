import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    enum: ['Notes', 'Videos', 'Books', 'Links', 'Assignments', 'Other']
  },
  url: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String,
    default: ''
  },
  fileName: {
    type: String,
    default: ''
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    default: 'All'
  },
  year: {
    type: String,
    default: 'All'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Resource = mongoose.model('Resource', resourceSchema);

export default Resource;
