import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  repliedAt: {
    type: Date
  },
  reply: {
    type: String
  },
  // For threaded conversations
  conversationId: {
    type: String,
    index: true
  },
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Generate conversation ID before saving
messageSchema.pre('save', function(next) {
  if (!this.conversationId) {
    // Create a unique conversation ID from both user IDs (sorted for consistency)
    const ids = [this.from.toString(), this.to.toString()].sort();
    this.conversationId = ids.join('_');
  }
  next();
});

export default mongoose.model('Message', messageSchema);
