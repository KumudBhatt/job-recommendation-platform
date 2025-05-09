const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const { auth, checkRole } = require('../middleware/auth');

// Get all applications for a job seeker
router.get('/', auth, checkRole(['jobseeker']), async (req, res) => {
  try {
    console.log("Fetching applications for user:", req.user._id);
    const applications = await Application.find({ applicant: req.user._id })
      .populate('job')
      .sort({ appliedAt: -1 });
    
    console.log(`Found ${applications.length} applications`);
    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Get all applications for a job (employer only)
router.get('/job/:jobId', auth, checkRole(['employer']), async (req, res) => {
  try {
    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant')
      .sort({ appliedAt: -1 });
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ message: 'Failed to fetch job applications' });
  }
});

// Apply for a job
router.post('/:jobId', auth, checkRole(['jobseeker']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: req.params.jobId,
      applicant: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const application = new Application({
      job: req.params.jobId,
      applicant: req.user._id,
      status: 'pending',
      appliedAt: new Date()
    });

    await application.save();
    res.status(201).json(application);
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ message: 'Failed to apply for job' });
  }
});

// Update application status (employer only)
router.patch('/:applicationId/status', auth, checkRole(['employer']), async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    await application.save();

    res.json(application);
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Failed to update application status' });
  }
});

module.exports = router; 