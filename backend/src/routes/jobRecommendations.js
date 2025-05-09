const express = require('express');
const router = express.Router();
const JobRecommendation = require('../models/JobRecommendation');
const Job = require('../models/Job');
const auth = require('../middleware/auth');

// Get recommendations for a user
router.get('/me', auth, async (req, res) => {
  try {
    const recommendations = await JobRecommendation.find({ userId: req.user._id })
      .populate('jobId')
      .sort({ createdAt: -1 });
    res.json(recommendations);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Error fetching recommendations' });
  }
});

// Create a new recommendation
router.post('/', auth, async (req, res) => {
  
  try {
    const { jobId, matchScore, reason } = req.body;

    // Validate jobId
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if recommendation already exists
    const existingRecommendation = await JobRecommendation.findOne({
      userId: req.user._id,
      jobId: jobId
    });

    if (existingRecommendation) {
      return res.status(400).json({ message: 'Recommendation already exists for this job' });
    }

    const recommendation = new JobRecommendation({
      userId: req.user._id,
      jobId: jobId,
      matchScore: matchScore || 0,
      reason: reason || 'Based on your profile and job requirements'
    });

    await recommendation.save();
    res.status(201).json(recommendation);
  } catch (error) {
    console.error('Error creating recommendation:', error);
    res.status(500).json({ message: 'Error creating recommendation' });
  }
});

// Update a recommendation
router.patch('/:id', auth, async (req, res) => {
  try {
    const { matchScore, reason } = req.body;
    const recommendation = await JobRecommendation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    if (matchScore !== undefined) recommendation.matchScore = matchScore;
    if (reason !== undefined) recommendation.reason = reason;

    await recommendation.save();
    res.json(recommendation);
  } catch (error) {
    console.error('Error updating recommendation:', error);
    res.status(500).json({ message: 'Error updating recommendation' });
  }
});

// Delete a recommendation
router.delete('/:id', auth, async (req, res) => {
  try {
    const recommendation = await JobRecommendation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!recommendation) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    res.json({ message: 'Recommendation deleted successfully' });
  } catch (error) {
    console.error('Error deleting recommendation:', error);
    res.status(500).json({ message: 'Error deleting recommendation' });
  }
});

module.exports = router; 