import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  teamSize: {
    type: Number,
    required: true,
    min: 2,
    max: 10,
    default: 5
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  registrationDeadline: {
    type: Date
  },
  venue: {
    type: String,
    trim: true
  },
  eventType: {
    type: String,
    enum: ['event', 'hackathon'],
    default: 'event'
  },
  isNew: {
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

// Auto-update status based on dates
eventSchema.pre('save', function(next) {
  const now = new Date();
  if (this.endDate < now) {
    this.status = 'completed';
  } else if (this.startDate <= now && this.endDate >= now) {
    this.status = 'ongoing';
  } else {
    this.status = 'upcoming';
  }
  next();
});

export default mongoose.model('Event', eventSchema);
