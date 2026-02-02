import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pendingInvites: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    }
  }],
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  problemStatement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProblemStatement'
  },
  status: {
    type: String,
    enum: ['forming', 'active', 'disbanded'],
    default: 'forming'
  },
  maxSize: {
    type: Number,
    default: 5
  },
  isComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual to check if team is complete
teamSchema.virtual('currentSize').get(function() {
  return this.members.length;
});

// Check if team can accept more members
teamSchema.methods.canAddMember = function() {
  return this.members.length < this.maxSize;
};

export default mongoose.model('Team', teamSchema);
