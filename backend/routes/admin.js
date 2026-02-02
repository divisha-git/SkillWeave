import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Team from '../models/Team.js';
import ProblemStatement from '../models/ProblemStatement.js';
import Company from '../models/Company.js';
import Message from '../models/Message.js';
import Settings from '../models/Settings.js';
import Event from '../models/Event.js';
import Resource from '../models/Resource.js';
import FeedbackTask from '../models/FeedbackTask.js';
import StudentFeedback from '../models/StudentFeedback.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);
router.use(authorize('admin'));

// Configure multer for file uploads with proper file naming
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

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
    
    // Parse with header row
    const data = xlsx.utils.sheet_to_json(worksheet, { 
      defval: '', // Default value for empty cells
      raw: false // Convert all values to strings
    });

    // Log first row for debugging
    if (data.length > 0) {
      console.log('Sample row keys:', Object.keys(data[0]));
      console.log('Sample row:', data[0]);
    }

    if (data.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        message: 'No data found in Excel file. Please check if the file has data rows.',
        imported: 0,
        errors: ['File appears to be empty or has no data rows']
      });
    }

    const alumniRecords = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Try multiple possible column name variations (case-insensitive)
        const getValue = (keys) => {
          for (const key of keys) {
            // Check exact match first
            if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
              return String(row[key]).trim();
            }
            // Check case-insensitive match
            const lowerKey = key.toLowerCase();
            for (const rowKey in row) {
              if (rowKey.toLowerCase() === lowerKey && row[rowKey] !== undefined && row[rowKey] !== null && row[rowKey] !== '') {
                return String(row[rowKey]).trim();
              }
            }
          }
          return '';
        };

        const name = getValue(['Name', 'name', 'NAME', 'Full Name', 'FullName', 'Student Name']);
        const company = getValue(['Company', 'company', 'COMPANY', 'Company Name', 'CompanyName', 'Organization']);
        const role = getValue(['Role', 'role', 'ROLE', 'Role at Company', 'RoleAtCompany', 'Position', 'Designation']);
        const yearOfPassing = getValue(['Year of passing', 'Year of Passing', 'YearOfPassing', 'yearOfPassing', 'Year', 'Passing Year', 'Graduation Year']);
        let email = getValue(['Email', 'email', 'EMAIL', 'Email Address', 'EmailAddress']);
        
        // Generate email if not provided
        if (!email && name) {
          email = `${name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')}@alumni.byts.com`;
        }

        if (!name || !company) {
          errors.push({ 
            row: i + 2, // +2 because Excel rows start at 1 and we have header
            error: `Missing required fields: ${!name ? 'Name' : ''} ${!company ? 'Company' : ''}`.trim(),
            data: row
          });
          continue;
        }

        // Check for duplicate by email
        const existing = await User.findOne({
          email: email.toLowerCase(),
          isBYTSAlumni: true
        });

        if (existing) {
          errors.push({ 
            row: i + 2, 
            error: 'Alumni with this email already exists',
            data: { name, email }
          });
          continue;
        }

        const alumni = new User({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          company: company.trim(),
          roleAtCompany: role.trim() || '',
          yearOfPassing: yearOfPassing.toString().trim() || '',
          role: 'alumni',
          isBYTSAlumni: true
        });

        await alumni.save();
        alumniRecords.push({
          _id: alumni._id,
          name: alumni.name,
          email: alumni.email,
          company: alumni.company
        });
      } catch (error) {
        errors.push({ 
          row: i + 2, 
          error: error.message,
          data: row
        });
      }
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
    }

    res.json({
      message: alumniRecords.length > 0 
        ? `Successfully imported ${alumniRecords.length} alumni record(s)` 
        : 'No alumni records were imported',
      imported: alumniRecords.length,
      totalRows: data.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit errors to first 10
      errorCount: errors.length
    });
  } catch (error) {
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to process Excel file',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

// Get Team Size Setting
router.get('/settings/team-size', async (req, res) => {
  try {
    const teamSize = await Settings.getSetting('teamSize', 5);
    res.json({ teamSize: parseInt(teamSize) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Set Team Size Setting
router.post('/settings/team-size', async (req, res) => {
  try {
    const { teamSize } = req.body;
    
    if (!teamSize || teamSize < 2 || teamSize > 20) {
      return res.status(400).json({ message: 'Team size must be between 2 and 20' });
    }

    await Settings.setSetting('teamSize', parseInt(teamSize));
    
    // Update all existing teams' maxSize
    await Team.updateMany({}, { maxSize: parseInt(teamSize) });
    
    res.json({ 
      message: 'Team size updated successfully',
      teamSize: parseInt(teamSize)
    });
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

    // Get team size setting
    const teamSize = await Settings.getSetting('teamSize', 5);

    res.json({
      totalStudents,
      totalAlumni,
      totalTeams,
      totalProblemStatements,
      totalCompanies,
      teamSize: parseInt(teamSize),
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

// ==================== EVENT MANAGEMENT ====================

// Create Event/Hackathon
router.post('/events', async (req, res) => {
  try {
    const { name, description, startDate, endDate, teamSize, registrationDeadline, venue } = req.body;

    const event = new Event({
      name,
      description,
      startDate,
      endDate,
      teamSize: teamSize || 5,
      registrationDeadline,
      venue,
      createdBy: req.user._id
    });

    await event.save();

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all events
router.get('/events', async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name email')
      .sort({ startDate: -1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single event with teams
router.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get teams for this event
    const teams = await Team.find({ event: event._id })
      .populate('leader', 'name email studentId department')
      .populate('members', 'name email studentId department')
      .populate('problemStatement', 'title');

    res.json({ event, teams });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update event
router.put('/events/:id', async (req, res) => {
  try {
    const { name, description, startDate, endDate, teamSize, registrationDeadline, venue, status } = req.body;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { name, description, startDate, endDate, teamSize, registrationDeadline, venue, status },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Also delete all teams associated with this event
    await Team.deleteMany({ event: event._id });

    res.json({ message: 'Event and associated teams deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== PROBLEM STATEMENT MANAGEMENT ====================

// Create Problem Statement (Admin)
router.post('/problem-statements', async (req, res) => {
  try {
    const { title, description, eventId, maxTeams } = req.body;

    const ps = new ProblemStatement({
      title,
      description,
      event: eventId,
      postedBy: req.user._id,
      postedByRole: 'admin',
      maxTeams: maxTeams || 5,
      isPrivate: false,
      status: 'open'
    });

    await ps.save();

    res.status(201).json({
      message: 'Problem Statement created successfully',
      problemStatement: ps
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all problem statements
router.get('/problem-statements', async (req, res) => {
  try {
    const { eventId, status } = req.query;
    const query = {};
    
    if (eventId) query.event = eventId;
    if (status) query.status = status;

    const problemStatements = await ProblemStatement.find(query)
      .populate('postedBy', 'name email')
      .populate('event', 'name')
      .populate('selectedTeams', 'name')
      .sort({ createdAt: -1 });

    res.json(problemStatements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update problem statement
router.put('/problem-statements/:id', async (req, res) => {
  try {
    const { title, description, maxTeams, status } = req.body;

    const ps = await ProblemStatement.findByIdAndUpdate(
      req.params.id,
      { title, description, maxTeams, status },
      { new: true }
    );

    if (!ps) {
      return res.status(404).json({ message: 'Problem Statement not found' });
    }

    res.json({
      message: 'Problem Statement updated successfully',
      problemStatement: ps
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete problem statement
router.delete('/problem-statements/:id', async (req, res) => {
  try {
    const ps = await ProblemStatement.findByIdAndDelete(req.params.id);

    if (!ps) {
      return res.status(404).json({ message: 'Problem Statement not found' });
    }

    // Remove PS reference from teams
    await Team.updateMany(
      { problemStatement: ps._id },
      { $unset: { problemStatement: 1 } }
    );

    res.json({ message: 'Problem Statement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== RESOURCES MANAGEMENT ====================

// Get all resources
router.get('/resources', async (req, res) => {
  try {
    const resources = await Resource.find()
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new resource with file upload
router.post('/resources', upload.single('file'), async (req, res) => {
  try {
    const { title, category, url, department, year } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: 'Title and category are required' });
    }

    const resourceData = {
      title,
      category,
      url: url || '',
      department: department || 'All',
      year: year || 'All',
      uploadedBy: req.user._id
    };

    // Handle file upload
    if (req.file) {
      resourceData.fileUrl = `/uploads/${req.file.filename}`;
      resourceData.fileName = req.file.originalname;
    }

    const resource = new Resource(resourceData);

    await resource.save();

    const populatedResource = await Resource.findById(resource._id)
      .populate('uploadedBy', 'name');

    res.status(201).json({
      message: 'Resource added successfully',
      resource: populatedResource
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a resource with file upload
router.put('/resources/:id', upload.single('file'), async (req, res) => {
  try {
    const { title, category, url, department, year, isActive } = req.body;

    const updateData = { title, category, url, department, year, isActive };

    // Handle file upload
    if (req.file) {
      updateData.fileUrl = `/uploads/${req.file.filename}`;
      updateData.fileName = req.file.originalname;
    }

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('uploadedBy', 'name');

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({
      message: 'Resource updated successfully',
      resource
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a resource
router.delete('/resources/:id', async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== FEEDBACK TASK ROUTES ====================

// Get all feedback tasks
router.get('/feedback-tasks', async (req, res) => {
  try {
    const tasks = await FeedbackTask.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create feedback task
router.post('/feedback-tasks', async (req, res) => {
  try {
    const { companyName, description, departments, driveDate, deadline } = req.body;

    if (!companyName || !departments || departments.length === 0) {
      return res.status(400).json({ message: 'Company name and at least one department are required' });
    }

    const task = new FeedbackTask({
      companyName,
      description,
      departments,
      driveDate,
      deadline,
      createdBy: req.user._id
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update feedback task
router.put('/feedback-tasks/:id', async (req, res) => {
  try {
    const { companyName, description, departments, driveDate, deadline, isActive } = req.body;

    const task = await FeedbackTask.findByIdAndUpdate(
      req.params.id,
      { companyName, description, departments, driveDate, deadline, isActive },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete feedback task
router.delete('/feedback-tasks/:id', async (req, res) => {
  try {
    const task = await FeedbackTask.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Also delete all related student feedback
    await StudentFeedback.deleteMany({ task: req.params.id });

    res.json({ message: 'Task and related feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all feedback submissions for a task
router.get('/feedback-tasks/:id/submissions', async (req, res) => {
  try {
    const submissions = await StudentFeedback.find({ task: req.params.id, isSubmitted: true })
      .populate('student', 'name email department studentId')
      .populate('task', 'companyName')
      .sort({ updatedAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all feedback submissions grouped by department
router.get('/feedback-submissions', async (req, res) => {
  try {
    const { taskId, department } = req.query;
    
    let query = { isSubmitted: true };
    if (taskId) query.task = taskId;

    let submissions = await StudentFeedback.find(query)
      .populate('student', 'name email department studentId year')
      .populate('task', 'companyName driveDate')
      .sort({ updatedAt: -1 });

    // Filter by department if specified
    if (department) {
      submissions = submissions.filter(s => s.student?.department === department);
    }

    // Group by department
    const grouped = submissions.reduce((acc, sub) => {
      const dept = sub.student?.department || 'Unknown';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(sub);
      return acc;
    }, {});

    res.json({ submissions, grouped });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Export feedback to Excel
router.get('/feedback-export/:taskId', async (req, res) => {
  try {
    const { department } = req.query;
    
    let submissions = await StudentFeedback.find({ task: req.params.taskId, isSubmitted: true })
      .populate('student', 'name email department studentId year')
      .populate('task', 'companyName driveDate')
      .sort({ 'student.department': 1, updatedAt: -1 });

    if (department) {
      submissions = submissions.filter(s => s.student?.department === department);
    }

    const task = await FeedbackTask.findById(req.params.taskId);

    // Prepare Excel data
    const excelData = [];
    
    submissions.forEach(sub => {
      const baseRow = {
        'Student Name': sub.student?.name || 'N/A',
        'Student ID': sub.student?.studentId || 'N/A',
        'Email': sub.student?.email || 'N/A',
        'Department': sub.student?.department || 'N/A',
        'Year': sub.student?.year || 'N/A',
        'Company': task?.companyName || 'N/A',
        'Overall Experience': sub.overallExperience || 'N/A',
        'Additional Comments': sub.additionalComments || 'N/A',
        'Submitted At': sub.updatedAt ? new Date(sub.updatedAt).toLocaleString() : 'N/A'
      };

      // Add rounds data
      if (sub.rounds && sub.rounds.length > 0) {
        sub.rounds.forEach((round, idx) => {
          baseRow[`Round ${idx + 1} Name`] = round.roundName || '';
          if (round.fields && round.fields.length > 0) {
            round.fields.forEach(field => {
              baseRow[`R${idx + 1}: ${field.fieldName}`] = field.fieldValue || '';
            });
          }
        });
      }

      excelData.push(baseRow);
    });

    // Create workbook
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(excelData);
    xlsx.utils.book_append_sheet(wb, ws, 'Feedback');

    // Write to buffer
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${task?.companyName || 'feedback'}_feedback.xlsx"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
