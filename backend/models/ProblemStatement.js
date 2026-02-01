import mongoose from 'mongoose';

const problemStatementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  similarityScore: {
    type: Number,
    default: 0
  },
  similarPS: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProblemStatement'
  }]
}, {
  timestamps: true
});

// Text index for similarity search
problemStatementSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('ProblemStatement', problemStatementSchema);
