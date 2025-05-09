const express = require('express');
const router = express.Router();
const { z } = require('zod');
const Job = require('../models/Job');
const User = require('../models/User');
const { auth, checkRole, validateInput } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Validation schemas
const createJobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  description: z.string().min(1),
  experience: z.enum(['entry-level', 'mid-level', 'senior-level', 'lead']),
  requirements: z.array(
    z.object({
      skills: z.array(z.string()),
      experience: z.preprocess(val => Number(val), z.number()),
      education: z.string(),
      type: z.string(),
      certifications: z.array(z.string()).optional()
    })
  ),
  location: z.string(),
  jobType: z.enum(['remote', 'hybrid', 'onsite']),
  salary: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    currency: z.string().default('USD')
  }),
  benefits: z.array(z.string()).optional()
});

const updateJobSchema = createJobSchema.partial();

// Rate limiter for recommendations endpoint
const recommendationsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Increased to 100 requests per minute
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  keyGenerator: (req) => {
    return req.user._id.toString(); // Rate limit by user ID instead of IP
  }
});

// Create new job posting
router.post('/', auth, checkRole(['employer']), validateInput(createJobSchema), async (req, res) => {
  try {
    const job = new Job({
      ...req.body,
      employer: req.user._id
    });
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all jobs with filters
router.get('/', async (req, res) => {
  try {
    const {
      search,
      location,
      jobType,
      skills,
      minSalary,
      maxSalary,
      page = 1,
      limit = 10
    } = req.query;

    const query = { status: 'active' };
    
    if (search) {
      query.$text = { $search: search };
    }
    if (location) {
      query.location = location;
    }
    if (jobType) {
      query.jobType = jobType;
    }
    if (skills) {
      query['requirements.skills'] = { $in: skills.split(',') };
    }
    if (minSalary || maxSalary) {
      query.salary = {};
      if (minSalary) query.salary.min = { $gte: Number(minSalary) };
      if (maxSalary) query.salary.max = { $lte: Number(maxSalary) };
    }

    const jobs = await Job.find(query)
      .populate('employer', 'company.name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Job.countDocuments(query);

    res.json({
      jobs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'company.name');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update job posting
router.patch('/:id', auth, checkRole(['employer']), validateInput(updateJobSchema), async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      employer: req.user._id
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found or unauthorized' });
    }

    Object.keys(req.body).forEach(update => {
      job[update] = req.body[update];
    });

    await job.save();
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete job posting
router.delete('/:id', auth, checkRole(['employer']), async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      employer: req.user._id
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found or unauthorized' });
    }

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get AI-powered job recommendations
router.get('/recommendations', auth, checkRole(['jobseeker']), recommendationsLimiter, async (req, res) => {
  try {
    // Get user with profile
    const user = await User.findById(req.user._id).populate('profile');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all active jobs
    const jobs = await Job.find({ status: 'active' });
    if (!jobs.length) {
      return res.status(404).json({ message: 'No active jobs found' });
    }

    // If no profile exists, return all active jobs
    if (!user.profile) {
      const allJobs = jobs.map(job => ({
        ...job.toObject(),
        matchScore: 0,
        skillMatch: [],
        missingSkills: [],
        message: 'Complete your profile to get personalized job recommendations'
      }));
      return res.json(allJobs);
    }

    // Format data for AI service
    const userProfile = {
      skills: user.profile.skills || [],
      experience: user.profile.experience || [],
      education: user.profile.education || []
    };

    const formattedJobs = jobs.map(job => ({
      id: job._id.toString(),
      title: job.title,
      description: job.description,
      requirements: {
        skills: job.requirements[0]?.skills || [],
        experience: job.requirements[0]?.experience || 0,
        education: job.requirements[0]?.education || '',
        type: job.requirements[0]?.type || 'required',
        certifications: job.requirements[0]?.certifications || []
      }
    }));

    // Get recommendations from AI service
    try {
      const response = await fetch(`${process.env.AI_SERVICE_URL}/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userProfile,
          jobs: formattedJobs
        })
      });

      if (!response.ok) {
        throw new Error('AI service request failed');
      }

      const recommendations = await response.json();

      // Map recommendations back to full job objects
      const recommendedJobs = recommendations.map(rec => {
        const job = jobs.find(j => j._id.toString() === rec.jobId);
        if (!job) return null;
        return {
          ...job.toObject(),
          matchScore: rec.matchScore,
          skillMatch: rec.skillMatch,
          missingSkills: rec.missingSkills
        };
      }).filter(Boolean);

      res.json(recommendedJobs);
    } catch (aiError) {
      // If AI service fails, return all active jobs
      const allJobs = jobs.map(job => ({
        ...job.toObject(),
        matchScore: 0,
        skillMatch: [],
        missingSkills: [],
        message: 'AI service temporarily unavailable. Showing all active jobs.'
      }));
      res.json(allJobs);
    }
  } catch (error) {
    console.error('Error getting job recommendations:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to get job recommendations'
    });
  }
});

module.exports = router; 