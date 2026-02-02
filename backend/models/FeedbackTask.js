import mongoose from 'mongoose';

const feedbackTaskSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  departments: [{
    type: String,
    required: true
  }],
  driveDate: {
    type: Date
  },
  deadline: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('FeedbackTask', feedbackTaskSchema);
