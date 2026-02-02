import mongoose from 'mongoose';

const roundSchema = new mongoose.Schema({
  roundNumber: {
    type: Number,
    required: true
  },
  roundName: {
    type: String,
    required: true,
    trim: true
  },
  fields: [{
    fieldName: {
      type: String,
      required: true
    },
    fieldValue: {
      type: String,
      default: ''
    }
  }]
});

const studentFeedbackSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeedbackTask',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rounds: [roundSchema],
  overallExperience: {
    type: String,
    enum: ['Excellent', 'Good', 'Average', 'Poor'],
    default: 'Good'
  },
  additionalComments: {
    type: String,
    trim: true
  },
  isSubmitted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure one feedback per student per task
studentFeedbackSchema.index({ task: 1, student: 1 }, { unique: true });

export default mongoose.model('StudentFeedback', studentFeedbackSchema);
