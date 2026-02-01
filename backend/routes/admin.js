import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Team from '../models/Team.js';
import ProblemStatement from '../models/ProblemStatement.js';
import Company from '../models/Company.js';
import Message from '../models/Message.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);
router.use(authorize('admin'));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Add Student
router.post('/students', async (req, res) => {
  try {
    const { name, department, year, email, studentId } = req.body;

    // Check if student already exists
    const existingStudent = await User.findOne({
      $or: [{ email }, { studentId }]
    });

    if (existingStudent) {
      return res.status(400).json({ message: 'Student with this email or ID already exists' });
    }

    const student = new User({
      name,
      email,
      studentId,
      department,
      year,
      role: 'student'
    });

    await student.save();

    res.status(201).json({
      message: 'Student added successfully',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        department: student.department,
        year: student.year
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ name: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get students by department
router.get('/students/department/:department', async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      department: req.params.department
    }).select('-password').sort({ name: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark Attendance
router.post('/attendance', async (req, res) => {
  try {
    const { department, date, attendanceData } = req.body;

    const attendanceRecords = [];
    const errors = [];

    for (const record of attendanceData) {
      try {
        // Check if attendance already exists
        const existing = await Attendance.findOne({
          student: record.studentId,
          date: new Date(date)
        });

        if (existing) {
          // Update existing attendance
          existing.status = record.status;
          existing.markedBy = req.user._id;
          await existing.save();
          attendanceRecords.push(existing);
        } else {
          // Create new attendance
          const attendance = new Attendance({
            student: record.studentId,
            date: new Date(date),
            status: record.status,
            department,
            markedBy: req.user._id
          });
          await attendance.save();
          attendanceRecords.push(attendance);
        }
      } catch (error) {
        errors.push({ studentId: record.studentId, error: error.message });
      }
    }

    res.json({
      message: 'Attendance marked successfully',
      records: attendanceRecords.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance report - student wise
router.get('/attendance/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const attendances = await Attendance.find({ student: studentId })
      .populate('student', 'name email studentId')
      .sort({ date: -1 });

    const total = attendances.length;
    const present = attendances.filter(a => a.status === 'present').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    res.json({
      student: attendances[0]?.student,
      total,
      present,
      absent: total - present,
      percentage: parseFloat(percentage),
      records: attendances
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get attendance report - department wise
router.get('/attendance/department/:department', async (req, res) => {
  try {
    const students = await User.find({
      role: 'student',
      department: req.params.department
    });

    const reports = await Promise.all(
      students.map(async (student) => {
        const attendances = await Attendance.find({ student: student._id });
        const total = attendances.length;
        const present = attendances.filter(a => a.status === 'present').length;
        const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

        return {
          student: {
            id: student._id,
            name: student.name,
            email: student.email,
            studentId: student.studentId
          },
          total,
          present,
          absent: total - present,
          percentage: parseFloat(percentage)
        };
      })
    );

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload Alumni Excel
router.post('/alumni/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const alumniRecords = [];
    const errors = [];

    for (const row of data) {
      try {
        const name = row['Name'] || row['name'] || '';
        const company = row['Company'] || row['company'] || '';
        const role = row['Role'] || row['role'] || row['Role at Company'] || '';
        const yearOfPassing = row['Year of passing'] || row['Year of Passing'] || row['yearOfPassing'] || '';
        const email = row['Email'] || row['email'] || `${name.toLowerCase().replace(/\s+/g, '.')}@alumni.byts.com`;

        if (!name || !company) {
          errors.push({ row, error: 'Missing required fields: Name or Company' });
          continue;
        }

        // Check for duplicate
        const existing = await User.findOne({
          email: email.toLowerCase(),
          isBYTSAlumni: true
        });

        if (existing) {
          errors.push({ row, error: 'Alumni already exists' });
          continue;
        }

        const alumni = new User({
          name,
          email: email.toLowerCase(),
          company,
          roleAtCompany: role,
          yearOfPassing: yearOfPassing.toString(),
          role: 'alumni',
          isBYTSAlumni: true
        });

        await alumni.save();
        alumniRecords.push(alumni);
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Alumni data uploaded successfully',
      imported: alumniRecords.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all alumni
router.get('/alumni', async (req, res) => {
  try {
    const alumni = await User.find({ role: 'alumni', isBYTSAlumni: true })
      .select('-password')
      .sort({ name: 1 });
    res.json(alumni);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalAlumni = await User.countDocuments({ role: 'alumni', isBYTSAlumni: true });
    const totalTeams = await Team.countDocuments({ status: 'active' });
    const totalProblemStatements = await ProblemStatement.countDocuments();
    const totalCompanies = await Company.countDocuments();

    // Attendance statistics
    const totalAttendanceRecords = await Attendance.countDocuments();
    const presentRecords = await Attendance.countDocuments({ status: 'present' });
    const overallAttendance = totalAttendanceRecords > 0
      ? ((presentRecords / totalAttendanceRecords) * 100).toFixed(2)
      : 0;

    // Department-wise stats
    const departments = await User.distinct('department', { role: 'student' });
    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const deptStudents = await User.countDocuments({ role: 'student', department: dept });
        return { department: dept, students: deptStudents };
      })
    );

    res.json({
      totalStudents,
      totalAlumni,
      totalTeams,
      totalProblemStatements,
      totalCompanies,
      attendance: {
        totalRecords: totalAttendanceRecords,
        presentRecords,
        overallPercentage: parseFloat(overallAttendance)
      },
      departmentStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
