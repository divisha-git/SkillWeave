import express from 'express';
import Attendance from '../models/Attendance.js';
import Team from '../models/Team.js';
import ProblemStatement from '../models/ProblemStatement.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Settings from '../models/Settings.js';
import { authenticate, authorize } from '../middleware/auth.js';

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
    const { company } = req.query;
    const query = { role: 'alumni', isBYTSAlumni: true };
    
    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }

    const alumni = await User.find(query)
      .select('name company roleAtCompany yearOfPassing email')
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
      .populate('from', 'name email')
      .populate('to', 'name email')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
