import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Attendance from '../models/Attendance.js';
import Team from '../models/Team.js';
import ProblemStatement from '../models/ProblemStatement.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Settings from '../models/Settings.js';
import Event from '../models/Event.js';
import Resource from '../models/Resource.js';
import FeedbackTask from '../models/FeedbackTask.js';
import StudentFeedback from '../models/StudentFeedback.js';
import { authenticate, authorize } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
router.use(authenticate);
router.use(authorize('student'));

// Get Pending Invitations
router.get('/invitations', async (req, res) => {
  try {
    const invitations = await Team.find({
      'pendingInvites.student': req.user._id,
      'pendingInvites.status': 'pending',
      status: 'active'
    })
      .populate('leader', 'name email')
      .populate('pendingInvites.student', 'name email')
      .select('name leader pendingInvites maxSize');

    // Filter to only get invites for this student
    const myInvitations = invitations.map(team => {
      const myInvite = team.pendingInvites.find(
        inv => inv.student._id.toString() === req.user._id.toString() && inv.status === 'pending'
      );
      return {
        teamId: team._id,
        teamName: team.name,
        leader: team.leader,
        inviteId: myInvite._id,
        invitedAt: myInvite.invitedAt,
        maxSize: team.maxSize,
        currentSize: team.members.length + 1
      };
    }).filter(inv => inv.inviteId); // Remove any null entries

    res.json(myInvitations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Student Profile
router.get('/profile', async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select('-password');

    // Calculate attendance percentage
    const attendances = await Attendance.find({ student: req.user._id });
    const total = attendances.length;
    const present = attendances.filter(a => a.status === 'present').length;
    const attendancePercentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    // Get teams
    const teams = await Team.find({
      $or: [
        { leader: req.user._id },
        { members: req.user._id }
      ],
      status: 'active'
    }).populate('leader', 'name email').populate('members', 'name email');

    // Get problem statements
    const problemStatements = await ProblemStatement.find({
      team: { $in: teams.map(t => t._id) }
    }).populate('team', 'name');

    // Get companies attended
    const companies = await Company.find({
      attendedBy: req.user._id
    }).select('name round');

    // Get relevant alumni (based on company match)
    const companyNames = companies.map(c => c.name);
    const relevantAlumni = await User.find({
      role: 'alumni',
      isBYTSAlumni: true,
      company: { $in: companyNames }
    }).select('name company roleAtCompany email');

    // Get pending invitations
    const invitations = await Team.find({
      'pendingInvites.student': req.user._id,
      'pendingInvites.status': 'pending',
      status: 'active'
    })
      .populate('leader', 'name email')
      .select('name leader pendingInvites maxSize members');

    const myInvitations = invitations.map(team => {
      const myInvite = team.pendingInvites.find(
        inv => inv.student.toString() === req.user._id.toString() && inv.status === 'pending'
      );
      return myInvite ? {
        teamId: team._id,
        teamName: team.name,
        leader: team.leader,
        inviteId: myInvite._id,
        invitedAt: myInvite.invitedAt,
        maxSize: team.maxSize || 5,
        currentSize: (team.members ? team.members.length : 0) + 1 // +1 for leader
      } : null;
    }).filter(inv => inv !== null);

    res.json({
      student,
      attendance: {
        total,
        present,
        absent: total - present,
        percentage: parseFloat(attendancePercentage)
      },
      teams,
      problemStatements,
      companies,
      relevantAlumni,
      pendingInvitations: myInvitations
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Student Profile
router.put('/profile', async (req, res) => {
  try {
    const { name, studentId, department, year, skills, cgpa, achievements, resume, profilePic } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (studentId) updateData.studentId = studentId;
    if (department) updateData.department = department;
    if (year) updateData.year = year;
    if (skills !== undefined) updateData.skills = skills;
    if (cgpa !== undefined) updateData.cgpa = cgpa;
    if (achievements !== undefined) updateData.achievements = achievements;
    if (resume !== undefined) updateData.resume = resume;
    if (profilePic !== undefined) updateData.profilePic = profilePic;

    const student = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      student
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all BYTS students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('name email studentId department year')
      .sort({ name: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create Team
router.post('/teams', async (req, res) => {
  try {
    const { name } = req.body;

    // Check if student is already in a team
    const existingTeam = await Team.findOne({
      $or: [
        { leader: req.user._id },
        { members: req.user._id }
      ],
      status: 'active'
    });

    if (existingTeam) {
      return res.status(400).json({ message: 'You are already part of a team' });
    }

    // Get team size from settings
    const maxTeamSize = await Settings.getSetting('teamSize', 5);

    const team = new Team({
      name,
      leader: req.user._id,
      members: [req.user._id],
      maxSize: parseInt(maxTeamSize)
    });

    await team.save();
    await team.populate('leader', 'name email');
    await team.populate('members', 'name email');

    res.status(201).json({
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Invite student to team
router.post('/teams/:teamId/invite', async (req, res) => {
  try {
    const { teamId } = req.params;
    const { studentId } = req.body;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can invite members' });
    }

    // Check team size limit (including pending invites)
    const currentMembers = team.members.length + 1; // +1 for leader
    const pendingInvitesCount = team.pendingInvites.filter(
      inv => inv.status === 'pending'
    ).length;
    const totalSize = currentMembers + pendingInvitesCount;
    const maxSize = team.maxSize || 5;
    
    if (totalSize >= maxSize) {
      return res.status(400).json({ 
        message: `Cannot send invite. Team will exceed maximum size of ${maxSize} members (including leader). Current: ${currentMembers} members + ${pendingInvitesCount} pending invites.` 
      });
    }

    // Check if student is already in a team
    const studentInTeam = await Team.findOne({
      $or: [
        { leader: studentId },
        { members: studentId }
      ],
      status: 'active'
    });

    if (studentInTeam) {
      return res.status(400).json({ message: 'Student is already in a team' });
    }

    // Check if already invited
    const existingInvite = team.pendingInvites.find(
      invite => invite.student.toString() === studentId && invite.status === 'pending'
    );

    if (existingInvite) {
      return res.status(400).json({ message: 'Invite already sent' });
    }

    team.pendingInvites.push({
      student: studentId,
      status: 'pending'
    });

    await team.save();
    await team.populate('pendingInvites.student', 'name email');

    res.json({
      message: 'Invite sent successfully',
      team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept/Reject team invite
router.post('/teams/:teamId/invite/:inviteId', async (req, res) => {
  try {
    const { teamId, inviteId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const invite = team.pendingInvites.id(inviteId);
    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    if (invite.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (action === 'accept') {
      // Check team size before accepting
      const currentSize = team.members.length + 1; // +1 for leader
      const maxSize = team.maxSize || 5;
      
      if (currentSize >= maxSize) {
        return res.status(400).json({ 
          message: `Cannot accept invitation. Team is full (${maxSize} members maximum).` 
        });
      }

      invite.status = 'accepted';
      if (!team.members.includes(invite.student)) {
        team.members.push(invite.student);
      }
    } else {
      invite.status = 'rejected';
    }

    await team.save();
    await team.populate('members', 'name email');
    await team.populate('leader', 'name email');

    res.json({
      message: `Invite ${action}ed successfully`,
      team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get my teams
router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { leader: req.user._id },
        { members: req.user._id }
      ]
    })
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .populate('pendingInvites.student', 'name email')
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Post Problem Statement
router.post('/problem-statements', async (req, res) => {
  try {
    const { title, description } = req.body;

    // Check if student is in a team
    const team = await Team.findOne({
      $or: [
        { leader: req.user._id },
        { members: req.user._id }
      ],
      status: 'active'
    });

    if (!team) {
      return res.status(400).json({ message: 'You must be in a team to post a problem statement' });
    }

    // Check for similar problem statements
    const similarPS = await ProblemStatement.find({
      $text: { $search: title }
    }).limit(5);

    let similarityWarning = null;
    if (similarPS.length > 0) {
      similarityWarning = 'Similar problem statement exists. Please modify.';
    }

    const problemStatement = new ProblemStatement({
      title,
      description,
      team: team._id,
      postedBy: req.user._id,
      isPrivate: true,
      similarPS: similarPS.map(ps => ps._id)
    });

    await problemStatement.save();
    await problemStatement.populate('team', 'name');
    await problemStatement.populate('postedBy', 'name email');

    res.status(201).json({
      message: 'Problem statement posted successfully',
      warning: similarityWarning,
      problemStatement
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get my problem statements
router.get('/problem-statements', async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { leader: req.user._id },
        { members: req.user._id }
      ]
    });

    const problemStatements = await ProblemStatement.find({
      team: { $in: teams.map(t => t._id) }
    })
      .populate('team', 'name')
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(problemStatements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Post Company Attendance & Questions
router.post('/companies/attend', async (req, res) => {
  try {
    const { companyName, round, questions, experience } = req.body;

    let company = await Company.findOne({ name: companyName });
    
    if (!company) {
      company = new Company({
        name: companyName,
        round,
        questions: [],
        experiences: [],
        attendedBy: []
      });
    }

    if (questions && questions.length > 0) {
      company.questions.push({
        question: questions.join('\n'),
        postedBy: req.user._id
      });
    }

    if (experience) {
      company.experiences.push({
        summary: experience,
        postedBy: req.user._id
      });
    }

    if (!company.attendedBy.includes(req.user._id)) {
      company.attendedBy.push(req.user._id);
    }

    await company.save();
    await company.populate('attendedBy', 'name email');

    res.json({
      message: 'Company attendance and questions posted successfully',
      company
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search companies
router.get('/companies/search', async (req, res) => {
  try {
    const { query } = req.query;
    const companies = await Company.find({
      name: { $regex: query, $options: 'i' }
    })
      .populate('questions.postedBy', 'name')
      .populate('experiences.postedBy', 'name')
      .populate('attendedBy', 'name email');

    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all companies
router.get('/companies', async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('questions.postedBy', 'name')
      .populate('experiences.postedBy', 'name')
      .populate('attendedBy', 'name email')
      .sort({ name: 1 });

    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search Alumni
router.get('/alumni/search', async (req, res) => {
  try {
    const { company, name, department } = req.query;
    const query = { role: 'alumni' };
    
    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }
    
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    
    if (department) {
      query.department = { $regex: department, $options: 'i' };
    }

    const alumni = await User.find(query)
      .select('name company roleAtCompany yearOfPassing email department domain linkedin phone experience')
      .sort({ name: 1 });

    res.json(alumni);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all alumni
router.get('/alumni', async (req, res) => {
  try {
    const alumni = await User.find({ role: 'alumni' })
      .select('name company roleAtCompany yearOfPassing email department domain linkedin phone experience')
      .sort({ name: 1 });

    res.json(alumni);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send message to alumni
router.post('/alumni/:alumniId/message', async (req, res) => {
  try {
    const { alumniId } = req.params;
    const { subject, content } = req.body;

    const alumni = await User.findById(alumniId);
    if (!alumni || alumni.role !== 'alumni') {
      return res.status(404).json({ message: 'Alumni not found' });
    }

    const message = new Message({
      from: req.user._id,
      to: alumniId,
      subject,
      content
    });

    await message.save();
    await message.populate('from', 'name email');
    await message.populate('to', 'name email');

    res.status(201).json({
      message: 'Message sent successfully',
      message: message
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get my messages
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.user._id },
        { to: req.user._id }
      ]
    })
      .populate('from', 'name email role')
      .populate('to', 'name email role')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get conversation with specific alumni
router.get('/alumni/:alumniId/conversation', async (req, res) => {
  try {
    const { alumniId } = req.params;
    const studentId = req.user._id;

    // Verify alumni exists
    const alumni = await User.findById(alumniId);
    if (!alumni || alumni.role !== 'alumni') {
      return res.status(404).json({ message: 'Alumni not found' });
    }

    // Get all messages between student and alumni
    const messages = await Message.find({
      $or: [
        { from: studentId, to: alumniId },
        { from: alumniId, to: studentId }
      ]
    })
      .populate('from', 'name email role profilePic')
      .populate('to', 'name email role profilePic')
      .sort({ createdAt: 1 });

    // Mark messages sent to this student as read
    await Message.updateMany(
      { from: alumniId, to: studentId, isRead: false },
      { isRead: true }
    );

    res.json({
      alumni: {
        _id: alumni._id,
        name: alumni.name,
        company: alumni.company,
        roleAtCompany: alumni.roleAtCompany,
        profilePic: alumni.profilePic
      },
      messages
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send message in conversation
router.post('/alumni/:alumniId/chat', async (req, res) => {
  try {
    const { alumniId } = req.params;
    const { content } = req.body;

    const alumni = await User.findById(alumniId);
    if (!alumni || alumni.role !== 'alumni') {
      return res.status(404).json({ message: 'Alumni not found' });
    }

    const message = new Message({
      from: req.user._id,
      to: alumniId,
      content
    });

    await message.save();
    await message.populate('from', 'name email role profilePic');
    await message.populate('to', 'name email role profilePic');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread message count per alumni
router.get('/alumni/unread-counts', async (req, res) => {
  try {
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          to: req.user._id,
          isRead: false
        }
      },
      {
        $group: {
          _id: '$from',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format { alumniId: count }
    const countsMap = {};
    unreadCounts.forEach(item => {
      countsMap[item._id.toString()] = item.count;
    });

    res.json(countsMap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== EVENT/HACKATHON ROUTES ====================

// Get all upcoming events
router.get('/events', async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    const events = await Event.find(query)
      .populate('createdBy', 'name')
      .sort({ startDate: 1 });

    // Add registration status for current user
    const eventsWithStatus = await Promise.all(events.map(async (event) => {
      const myTeam = await Team.findOne({
        event: event._id,
        $or: [
          { leader: req.user._id },
          { members: req.user._id }
        ]
      }).populate('members', 'name email studentId department');

      return {
        ...event.toObject(),
        isRegistered: !!myTeam,
        myTeam: myTeam
      };
    }));

    res.json(eventsWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single event with details
router.get('/events/:eventId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate('createdBy', 'name');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Get my team for this event
    const myTeam = await Team.findOne({
      event: event._id,
      $or: [
        { leader: req.user._id },
        { members: req.user._id }
      ]
    })
      .populate('leader', 'name email studentId department')
      .populate('members', 'name email studentId department')
      .populate('pendingInvites.student', 'name email studentId department')
      .populate('problemStatement', 'title description');

    // Get problem statements for this event
    const problemStatements = await ProblemStatement.find({
      event: event._id,
      postedByRole: 'admin',
      status: 'open'
    }).populate('selectedTeams', 'name');

    res.json({
      event,
      myTeam,
      problemStatements,
      isRegistered: !!myTeam
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get available students for an event (not in any team for this event)
router.get('/events/:eventId/available-students', async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get all students
    const allStudents = await User.find({ role: 'student' })
      .select('name email studentId department year');

    // Get all teams for this event
    const teamsInEvent = await Team.find({ event: eventId });

    // Get all students who are in a team for this event
    const studentsInTeams = new Set();
    teamsInEvent.forEach(team => {
      if (team.leader) studentsInTeams.add(team.leader.toString());
      team.members.forEach(member => studentsInTeams.add(member.toString()));
      team.pendingInvites.forEach(invite => {
        if (invite.status === 'pending') {
          studentsInTeams.add(invite.student.toString());
        }
      });
    });

    // Filter available students
    const availableStudents = allStudents.filter(
      student => !studentsInTeams.has(student._id.toString())
    );

    res.json(availableStudents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create team for an event
router.post('/events/:eventId/teams', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if registration is still open
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Check if student is already in a team for this event
    const existingTeam = await Team.findOne({
      event: eventId,
      $or: [
        { leader: req.user._id },
        { members: req.user._id }
      ]
    });

    if (existingTeam) {
      return res.status(400).json({ message: 'You are already in a team for this event' });
    }

    // Check if student has pending invite for this event
    const pendingInviteTeam = await Team.findOne({
      event: eventId,
      'pendingInvites.student': req.user._id,
      'pendingInvites.status': 'pending'
    });

    if (pendingInviteTeam) {
      return res.status(400).json({ 
        message: 'You have a pending invite for this event. Accept or reject it first.' 
      });
    }

    const team = new Team({
      name,
      leader: req.user._id,
      members: [req.user._id],
      event: eventId,
      maxSize: event.teamSize,
      status: 'forming'
    });

    await team.save();
    await team.populate('leader', 'name email studentId department');
    await team.populate('members', 'name email studentId department');

    res.status(201).json({
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Invite student to event team
router.post('/events/:eventId/teams/:teamId/invite', async (req, res) => {
  try {
    const { eventId, teamId } = req.params;
    const { studentId } = req.body;

    const team = await Team.findOne({ _id: teamId, event: eventId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can invite members' });
    }

    // Check team size limit
    const currentMembers = team.members.length;
    const pendingInvitesCount = team.pendingInvites.filter(inv => inv.status === 'pending').length;
    
    if (currentMembers + pendingInvitesCount >= team.maxSize) {
      return res.status(400).json({ 
        message: `Cannot send invite. Team will exceed maximum size of ${team.maxSize} members.` 
      });
    }

    // Check if student is already in a team for this event
    const studentInTeam = await Team.findOne({
      event: eventId,
      $or: [
        { leader: studentId },
        { members: studentId }
      ]
    });

    if (studentInTeam) {
      return res.status(400).json({ message: 'Student is already in a team for this event' });
    }

    // Check if already has pending invite for this event
    const hasPendingInvite = await Team.findOne({
      event: eventId,
      'pendingInvites.student': studentId,
      'pendingInvites.status': 'pending'
    });

    if (hasPendingInvite) {
      return res.status(400).json({ message: 'Student already has a pending invite for this event' });
    }

    team.pendingInvites.push({
      student: studentId,
      status: 'pending'
    });

    await team.save();
    await team.populate('pendingInvites.student', 'name email studentId department');

    res.json({
      message: 'Invite sent successfully',
      team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept/Reject event team invite
router.post('/events/:eventId/teams/:teamId/invite/:inviteId', async (req, res) => {
  try {
    const { eventId, teamId, inviteId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const team = await Team.findOne({ _id: teamId, event: eventId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const invite = team.pendingInvites.id(inviteId);
    if (!invite) {
      return res.status(404).json({ message: 'Invite not found' });
    }

    if (invite.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (action === 'accept') {
      // Check if already in a team for this event
      const alreadyInTeam = await Team.findOne({
        event: eventId,
        members: req.user._id,
        _id: { $ne: teamId }
      });

      if (alreadyInTeam) {
        return res.status(400).json({ message: 'You are already in another team for this event' });
      }

      // Check team size
      if (team.members.length >= team.maxSize) {
        return res.status(400).json({ message: `Team is full (${team.maxSize} members maximum)` });
      }

      invite.status = 'accepted';
      if (!team.members.includes(invite.student)) {
        team.members.push(invite.student);
      }

      // Check if team is complete
      if (team.members.length >= team.maxSize) {
        team.isComplete = true;
        team.status = 'active';
      }
    } else {
      invite.status = 'rejected';
    }

    await team.save();
    await team.populate('members', 'name email studentId department');
    await team.populate('leader', 'name email studentId department');

    res.json({
      message: `Invite ${action}ed successfully`,
      team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get my event invitations
router.get('/event-invitations', async (req, res) => {
  try {
    const invitations = await Team.find({
      'pendingInvites.student': req.user._id,
      'pendingInvites.status': 'pending'
    })
      .populate('leader', 'name email studentId')
      .populate('event', 'name startDate teamSize')
      .populate('pendingInvites.student', 'name email')
      .select('name leader event pendingInvites maxSize members');

    const myInvitations = invitations.map(team => {
      const myInvite = team.pendingInvites.find(
        inv => inv.student._id.toString() === req.user._id.toString() && inv.status === 'pending'
      );
      return myInvite ? {
        teamId: team._id,
        teamName: team.name,
        leader: team.leader,
        event: team.event,
        inviteId: myInvite._id,
        invitedAt: myInvite.invitedAt,
        maxSize: team.maxSize,
        currentSize: team.members.length
      } : null;
    }).filter(inv => inv !== null);

    res.json(myInvitations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== PROBLEM STATEMENT SELECTION ====================

// Get problem statements for an event
router.get('/events/:eventId/problem-statements', async (req, res) => {
  try {
    const { eventId } = req.params;

    const problemStatements = await ProblemStatement.find({
      event: eventId,
      postedByRole: 'admin',
      status: 'open'
    })
      .populate('selectedTeams', 'name')
      .sort({ createdAt: -1 });

    // Add availability status
    const psWithStatus = problemStatements.map(ps => ({
      ...ps.toObject(),
      slotsRemaining: ps.maxTeams - ps.selectedTeams.length,
      isFull: ps.selectedTeams.length >= ps.maxTeams
    }));

    res.json(psWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Select problem statement for team
router.post('/events/:eventId/problem-statements/:psId/select', async (req, res) => {
  try {
    const { eventId, psId } = req.params;

    // Get the team for this event where user is leader
    const team = await Team.findOne({
      event: eventId,
      leader: req.user._id
    });

    if (!team) {
      return res.status(400).json({ message: 'You must be a team leader to select a problem statement' });
    }

    // Check if team already has a PS
    if (team.problemStatement) {
      return res.status(400).json({ message: 'Your team has already selected a problem statement' });
    }

    const ps = await ProblemStatement.findById(psId);
    if (!ps) {
      return res.status(404).json({ message: 'Problem Statement not found' });
    }

    // Check if PS belongs to this event
    if (ps.event.toString() !== eventId) {
      return res.status(400).json({ message: 'Problem Statement does not belong to this event' });
    }

    // Check if PS can accept more teams
    if (ps.selectedTeams.length >= ps.maxTeams) {
      return res.status(400).json({ 
        message: `This problem statement has reached maximum team limit of ${ps.maxTeams}` 
      });
    }

    // Add team to PS and PS to team
    ps.selectedTeams.push(team._id);
    team.problemStatement = ps._id;

    // Close PS if it reached max teams
    if (ps.selectedTeams.length >= ps.maxTeams) {
      ps.status = 'closed';
    }

    await ps.save();
    await team.save();

    res.json({
      message: 'Problem Statement selected successfully',
      problemStatement: ps,
      team
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== TEAM DETAILS ====================

// Get my team details for all events
router.get('/my-teams', async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { leader: req.user._id },
        { members: req.user._id }
      ]
    })
      .populate('leader', 'name email studentId department')
      .populate('members', 'name email studentId department')
      .populate('pendingInvites.student', 'name email studentId')
      .populate('event', 'name startDate endDate status')
      .populate('problemStatement', 'title description')
      .sort({ createdAt: -1 });

    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get team details by ID
router.get('/teams/:teamId', async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('leader', 'name email studentId department')
      .populate('members', 'name email studentId department')
      .populate('pendingInvites.student', 'name email studentId')
      .populate('event', 'name startDate endDate status teamSize')
      .populate('problemStatement', 'title description');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is part of this team
    const isMember = team.members.some(m => m._id.toString() === req.user._id.toString()) ||
                     team.leader._id.toString() === req.user._id.toString();

    if (!isMember) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student's hackathons/events
router.get('/hackathons', async (req, res) => {
  try {
    const events = await Event.find({ status: 'active' }).sort({ startDate: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread message count for student (messages from alumni)
router.get('/messages/unread-count', async (req, res) => {
  try {
    // Count messages sent TO this student (from alumni) that are unread
    const count = await Message.countDocuments({
      to: req.user._id,
      isRead: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for student (from alumni)
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find({
      to: req.user._id
    })
    .populate('from', 'name email company roleAtCompany profilePic')
    .sort({ createdAt: -1 })
    .limit(20);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark message as read
router.put('/messages/:id/read', async (req, res) => {
  try {
    const message = await Message.findOneAndUpdate(
      { _id: req.params.id, to: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get student attendance records
router.get('/attendance', async (req, res) => {
  try {
    const attendances = await Attendance.find({ student: req.user._id })
      .sort({ date: -1 });
    
    // Calculate stats
    const total = attendances.length;
    const present = attendances.filter(a => a.status === 'present').length;
    const absent = attendances.filter(a => a.status === 'absent').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    res.json({
      records: attendances,
      stats: {
        total,
        present,
        absent,
        percentage
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get resources for students
router.get('/resources', async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    
    // Get resources for student's department/year or "All"
    const resources = await Resource.find({
      isActive: true,
      $or: [
        { department: 'All', year: 'All' },
        { department: student.department, year: 'All' },
        { department: 'All', year: student.year },
        { department: student.department, year: student.year }
      ]
    })
    .populate('uploadedBy', 'name')
    .sort({ createdAt: -1 });

    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download resource file
router.get('/resources/:id/download', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    
    if (!resource || !resource.fileUrl) {
      return res.status(404).json({ message: 'Resource or file not found' });
    }

    const filePath = path.join(__dirname, '..', resource.fileUrl);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set proper headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${resource.fileName}"`);
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==================== FEEDBACK ROUTES ====================

// Get feedback tasks for student's department
router.get('/feedback-tasks', async (req, res) => {
  try {
    const student = await User.findById(req.user._id);
    const studentDept = student?.department;

    if (!studentDept) {
      return res.status(400).json({ message: 'Student department not found' });
    }

    // Get active tasks for student's department
    const tasks = await FeedbackTask.find({
      isActive: true,
      departments: studentDept,
      $or: [
        { deadline: { $gte: new Date() } },
        { deadline: null }
      ]
    }).sort({ createdAt: -1 });

    // Get student's feedback for these tasks
    const taskIds = tasks.map(t => t._id);
    const feedbacks = await StudentFeedback.find({
      task: { $in: taskIds },
      student: req.user._id
    });

    // Map feedback status to tasks
    const tasksWithStatus = tasks.map(task => {
      const feedback = feedbacks.find(f => f.task.toString() === task._id.toString());
      return {
        ...task.toObject(),
        feedbackStatus: feedback ? (feedback.isSubmitted ? 'submitted' : 'draft') : 'pending',
        feedbackId: feedback?._id
      };
    });

    res.json(tasksWithStatus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get or create feedback for a task
router.get('/feedback/:taskId', async (req, res) => {
  try {
    let feedback = await StudentFeedback.findOne({
      task: req.params.taskId,
      student: req.user._id
    }).populate('task', 'companyName description driveDate');

    if (!feedback) {
      // Create empty feedback
      feedback = new StudentFeedback({
        task: req.params.taskId,
        student: req.user._id,
        rounds: [],
        overallExperience: 'Good',
        additionalComments: ''
      });
      await feedback.save();
      feedback = await StudentFeedback.findById(feedback._id).populate('task', 'companyName description driveDate');
    }

    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save/update feedback (draft or submit)
router.put('/feedback/:taskId', async (req, res) => {
  try {
    const { rounds, overallExperience, additionalComments, isSubmitted } = req.body;

    let feedback = await StudentFeedback.findOne({
      task: req.params.taskId,
      student: req.user._id
    });

    if (!feedback) {
      feedback = new StudentFeedback({
        task: req.params.taskId,
        student: req.user._id
      });
    }

    // Check if already submitted
    if (feedback.isSubmitted && isSubmitted) {
      return res.status(400).json({ message: 'Feedback already submitted and cannot be modified' });
    }

    feedback.rounds = rounds || [];
    feedback.overallExperience = overallExperience || 'Good';
    feedback.additionalComments = additionalComments || '';
    feedback.isSubmitted = isSubmitted || false;

    await feedback.save();

    res.json({ message: isSubmitted ? 'Feedback submitted successfully' : 'Feedback saved as draft', feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete feedback (only if not submitted)
router.delete('/feedback/:feedbackId', async (req, res) => {
  try {
    const feedback = await StudentFeedback.findOne({
      _id: req.params.feedbackId,
      student: req.user._id
    });

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.isSubmitted) {
      return res.status(400).json({ message: 'Cannot delete submitted feedback' });
    }

    await StudentFeedback.findByIdAndDelete(req.params.feedbackId);
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
