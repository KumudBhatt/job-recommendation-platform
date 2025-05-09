const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
    skills: {
        type: [String],
        required: true
    },
    experience: {
        type: Number,
        required: true
    },
    education: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    certifications: {
        type: [String],
        default: []
    }
}, { _id: false });

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    company: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    jobType: {
        type: String,
        enum: ['remote', 'hybrid', 'onsite'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    requirements: {
        type: [requirementSchema],
        required: true
    },
    responsibilities: [{
        type: String,
        required: true
    }],
    benefits: [{
        type: String
    }],
    salary: {
        min: {
            type: Number,
            required: true
        },
        max: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'USD'
        }
    },
    experience: {
        type: String,
        required: true,
        enum: ['entry-level', 'mid-level', 'senior-level', 'lead']
    },
    employer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    applications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    }],
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    }
}, { timestamps: true });

jobSchema.index({ title: 'text', description: 'text', 'requirements.skills': 'text' });

module.exports = mongoose.model('Job', jobSchema);