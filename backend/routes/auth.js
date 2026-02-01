import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register (with role selection)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, year, studentId, company, roleAtCompany, yearOfPassing } = req.body;

    // Validate role
    if (!['admin', 'student', 'alumni'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // For admin role, check if admin already exists (optional restriction)
    if (role === 'admin') {
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin account already exists. Please contact system administrator.' });
      }
    }

    // Build user object
    const userData = {
      name,
      email,
      password,
      role
    };

    // Add role-specific fields
    if (role === 'student') {
      if (!department || !year || !studentId) {
        return res.status(400).json({ message: 'Department, year, and student ID are required for students' });
      }
      userData.department = department;
      userData.year = year;
      userData.studentId = studentId;
    }

    if (role === 'alumni') {
      if (!company) {
        return res.status(400).json({ message: 'Company is required for alumni' });
      }
      userData.company = company;
      userData.roleAtCompany = roleAtCompany || '';
      userData.yearOfPassing = yearOfPassing || '';
      userData.isBYTSAlumni = true;
    }

    const user = new User(userData);
    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({ message: 'Email or Student ID already exists' });
    }
    res.status(500).json({ message: error.message });
  }
});

// Register Admin (first time setup - kept for backward compatibility)
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const admin = new User({
      name,
      email,
      password,
      role: 'admin'
    });

    await admin.save();

    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      user: {
        _id: admin._id,
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // All users must have a password to login
    if (!user.password) {
      return res.status(401).json({ message: 'Account not set up. Please set a password or contact administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        studentId: user.studentId
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
