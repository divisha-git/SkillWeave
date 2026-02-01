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
  }
}, {
  timestamps: true
});

export default mongoose.model('Message', messageSchema);
