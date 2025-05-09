const express = require('express');
const router = express.Router();
const { z } = require('zod');
const Job = require('../models/Job');
const User = require('../models/User');
const { auth, checkRole, validateInput } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const axios = require('axios');

// Validation schemas
const getRecommendationsSchema = z.object({
  limit: z.number().min(1).max(50).optional().default(10),
  skills: z.array(z.string()).optional(),
  experience: z.string().optional(),
  location: z.string().optional(),
  jobType: z.enum(['remote', 'hybrid', 'onsite']).optional()
});

// Rate limiter for recommendations endpoint
const recommendationsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true,
  keyGenerator: (req) => req.user._id.toString()
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Get personalized job recommendations
router.get('/jobs', auth, checkRole(['jobseeker']), validateInput(getRecommendationsSchema), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('profile');
    const { limit, skills, experience, location, jobType } = req.query;

    // Build query based on user profile and filters
    const query = { status: 'active' };
    
    if (skills && skills.length > 0) {
      query['requirements.skills'] = { $in: skills };
    }
    if (experience) {
      query['requirements.experience'] = experience;
    }
    if (location) {
      query.location = location;
    }
    if (jobType) {
      query.jobType = jobType;
    }

    // Get matching jobs
    const jobs = await Job.find(query)
      .populate('employer', 'company.name')
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // Get AI-powered recommendations
    const response = await fetch(`${process.env.AI_SERVICE_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userProfile: user.profile,
        jobs: jobs.map(job => ({
          id: job._id,
          title: job.title,
          description: job.description,
          requirements: job.requirements
        }))
      })
    });

    const recommendations = await response.json();

    // Combine and sort recommendations
    const recommendedJobs = jobs
      .map(job => ({
        ...job.toObject(),
        matchScore: recommendations.find(r => r.jobId === job._id.toString())?.matchScore || 0
      }))
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json(recommendedJobs);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get skill recommendations based on job title
router.get('/skills', auth, async (req, res) => {
  try {
    const { jobTitle } = req.query;

    if (!jobTitle) {
      return res.status(400).json({ message: 'Job title is required' });
    }

    // Get AI-powered skill recommendations
    const response = await fetch(`${process.env.AI_SERVICE_URL}/recommend-skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ jobTitle })
    });

    const recommendations = await response.json();
    res.json(recommendations);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get similar jobs based on a job ID
router.get('/similar/:jobId', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Find similar jobs based on skills and requirements
    const similarJobs = await Job.find({
      _id: { $ne: job._id },
      status: 'active',
      'requirements.skills': { $in: job.requirements.skills }
    })
      .populate('employer', 'company.name')
      .limit(5);

    res.json(similarJobs);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get career path recommendations
router.get('/career-path', auth, checkRole(['jobseeker']), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('profile');
    
    // Get AI-powered career path recommendations
    const response = await fetch(`${process.env.AI_SERVICE_URL}/career-path`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userProfile: user.profile,
        currentSkills: user.profile.skills,
        experience: user.profile.experience
      })
    });

    const recommendations = await response.json();
    res.json(recommendations);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get AI-powered job recommendations
router.get('/', auth, checkRole(['jobseeker']), recommendationsLimiter, async (req, res) => {
  try {
    // Get user profile
    const user = await User.findById(req.user._id).populate('profile');
    
    if (!user.profile) {
      // If no profile exists, return all active jobs with a message
      const activeJobs = await Job.find({ status: 'active' });
      return res.json({
        message: 'Please complete your profile to get personalized job recommendations.',
        jobs: activeJobs.map(job => ({
          ...job.toObject(),
          matchScore: 0,
          skillMatch: []
        }))
      });
    }

    // Get all active jobs
    const activeJobs = await Job.find({ status: 'active' });

    try {
      // Format user profile data for AI service
      const formattedUserProfile = {
        skills: user.profile.skills ? user.profile.skills.map(skill => ({
          name: skill,
          level: "intermediate" // Default level
        })) : [],
        experience: user.profile.experience ? user.profile.experience.map(exp => ({
          title: exp.title || "",
          company: exp.company || "",
          duration: exp.duration || "",
          description: exp.description || ""
        })) : [],
        education: user.profile.education ? user.profile.education.map(edu => ({
          degree: edu.degree || "",
          institution: edu.institution || "",
          year: edu.year || "",
          field: edu.field || ""
        })) : []
      };

      // Format jobs data for AI service
      const formattedJobs = activeJobs.map(job => ({
        id: job._id.toString(),
        title: job.title,
        description: job.description,
        requirements: job.requirements && job.requirements.length > 0 
          ? [{
              skills: job.requirements[0].skills || [],
              experience: job.requirements[0].experience || 0,
              education: job.requirements[0].education || "",
              type: job.requirements[0].type || "required",
              certifications: job.requirements[0].certifications || []
            }]
          : []
      }));

      // Call AI service for recommendations
      console.log("Sending to AI service:", JSON.stringify({ 
        userProfile: formattedUserProfile, 
        jobs: formattedJobs 
      }));
      
      const response = await axios.post(`${AI_SERVICE_URL}/recommend`, {
        userProfile: formattedUserProfile,
        jobs: formattedJobs
      });

      // Return recommendations with match scores
      res.json(response.data);
    } catch (aiError) {
      console.error('AI service error:', aiError);
      // If AI service fails, return all active jobs with a message
      res.json({
        message: 'AI service is temporarily unavailable. Showing all active jobs.',
        jobs: activeJobs.map(job => ({
          ...job.toObject(),
          matchScore: 0,
          skillMatch: []
        }))
      });
    }
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ 
      message: 'Failed to get job recommendations',
      error: error.message 
    });
  }
});

module.exports = router; 