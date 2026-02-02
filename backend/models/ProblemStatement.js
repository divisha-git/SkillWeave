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
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postedByRole: {
    type: String,
    enum: ['admin', 'student'],
    default: 'student'
  },
  // For student-posted PS
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  // For admin-posted PS - team selection limit
  maxTeams: {
    type: Number,
    default: 5
  },
  selectedTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  isPrivate: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'draft'],
    default: 'open'
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

// Check if PS can accept more teams
problemStatementSchema.methods.canAcceptTeam = function() {
  return this.selectedTeams.length < this.maxTeams;
};

// Text index for similarity search
problemStatementSchema.index({ title: 'text', description: 'text' });

export default mongoose.model('ProblemStatement', problemStatementSchema);
