import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return this.role === 'admin';
    }
  },
  role: {
    type: String,
    enum: ['admin', 'student', 'alumni'],
    required: true
  },
  studentId: {
    type: String,
    sparse: true,
    unique: true
  },
  department: {
    type: String,
    trim: true
  },
  year: {
    type: String
  },
  // Student additional fields
  skills: {
    type: String,
    trim: true
  },
  cgpa: {
    type: String,
    trim: true
  },
  achievements: {
    type: String,
    trim: true
  },
  resume: {
    type: String,
    trim: true
  },
  profilePic: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Alumni specific fields
  company: {
    type: String,
    trim: true
  },
  roleAtCompany: {
    type: String,
    trim: true
  },
  yearOfPassing: {
    type: String
  },
  experience: {
    type: String,
    trim: true
  },
  domain: {
    type: String,
    trim: true
  },
  interviewExperience: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  isBYTSAlumni: {
    type: Boolean,
    default: false
  },
  // Google OAuth
  googleId: {
    type: String,
    sparse: true
  },
  // Password Reset
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
