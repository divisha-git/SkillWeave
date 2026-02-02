import express from 'express';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);
router.use(authorize('alumni'));

// Get Alumni Profile
router.get('/profile', async (req, res) => {
  try {
    const alumni = await User.findById(req.user._id).select('-password');
    res.json(alumni);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Alumni Profile
router.put('/profile', async (req, res) => {
  try {
    const { 
      name, 
      yearOfPassing, 
      company, 
      experience, 
      domain, 
      interviewExperience, 
      linkedin, 
      email, 
      phone 
    } = req.body;

    const alumni = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        yearOfPassing,
        company,
        experience,
        domain,
        interviewExperience,
        linkedin,
        email,
        phone
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(alumni);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages
router.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find({ to: req.user._id })
      .populate('from', 'name email department studentId')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reply to message
router.post('/messages/:messageId/reply', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reply } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    message.reply = reply;
    message.repliedAt = new Date();
    message.isRead = true;

    await message.save();
    await message.populate('from', 'name email');
    await message.populate('to', 'name email');

    res.json({
      message: 'Reply sent successfully',
      message: message
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark message as read
router.patch('/messages/:messageId/read', async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.to.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    message.isRead = true;
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
