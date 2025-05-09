const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { z } = require('zod');
const fetch = require('node-fetch');
const Resume = require('../models/Resume');
const { auth, checkRole, validateInput } = require('../middleware/auth');
const { parseResume } = require('../services/resumeParser');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/resumes');
fs.access(uploadDir)
  .catch(() => fs.mkdir(uploadDir, { recursive: true }))
  .catch(console.error);

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/resumes');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

// Validation schemas
const updateResumeSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional()
});

// Upload resume
router.post('/', auth, checkRole(['jobseeker']), upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { title, isPublic } = req.body;
    const filePath = req.file.path;

    // Parse resume content
    let parsedData;
    try {
      parsedData = await parseResume(filePath, req.file.mimetype);
    } catch (parseError) {
      console.error('Resume parsing error:', parseError);
      // Continue with basic info if parsing fails
      parsedData = {
        name: title || req.file.originalname.replace(/\.[^/.]+$/, ''),
        email: '',
        phone: '',
        skills: [],
        experience: [],
        education: []
      };
    }

    // Create resume document
    const resume = new Resume({
      userId: req.user._id,
      fileName: req.file.originalname,
      fileUrl: `/uploads/resumes/${req.file.filename}`,
      parsedData
    });

    await resume.save();
    res.status(201).json(resume);
  } catch (error) {
    console.error('Resume upload error:', error);
    // Clean up uploaded file if resume creation fails
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(400).json({ message: error.message || 'Failed to upload resume' });
  }
});

// Get user's resumes
router.get('/me', auth, checkRole(['jobseeker']), async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resumes' });
  }
});

// Get public resumes
router.get('/public', async (req, res) => {
  try {
    const resumes = await Resume.find({ isPublic: true })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(resumes);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch public resumes' });
  }
});

// Get resume by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id)
      .select('-fileUrl');
    
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Check if user has permission to view resume
    if (!resume.isPublic && resume.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this resume' });
    }

    res.json(resume);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update resume
router.patch('/:id', auth, checkRole(['jobseeker']), validateInput(updateResumeSchema), async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found or unauthorized' });
    }

    Object.keys(req.body).forEach(update => {
      resume[update] = req.body[update];
    });

    await resume.save();
    res.json(resume);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete resume
router.delete('/:id', auth, checkRole(['jobseeker']), async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Delete file from storage
    await fs.unlink(resume.filePath).catch(console.error);

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resume' });
  }
});

// Download resume
router.get('/:id/download', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      $or: [
        { userId: req.user._id },
        { isPublic: true }
      ]
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.download(resume.filePath, resume.fileName);
  } catch (error) {
    res.status(500).json({ message: 'Failed to download resume' });
  }
});

// Get AI analysis of resume
router.get('/:id/analysis', auth, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Get analysis from AI service
    const response = await fetch(`${process.env.AI_SERVICE_URL}/analyze-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resumeId: resume._id,
        parsedData: resume.parsedData
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI analysis');
    }

    const analysis = await response.json();
    resume.aiAnalysis = analysis;
    await resume.save();

    res.json(analysis);
  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({ message: 'Failed to get AI analysis' });
  }
});

module.exports = router;