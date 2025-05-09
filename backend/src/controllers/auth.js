const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register new user
const register = async (req, res) => {
  try {
    console.log('Register request body:', req.body); // Debug log
    const { email, password, firstName, lastName, role, company, confirmPassword } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role || !confirmPassword) {
      console.log('Missing required fields:', { email, password, firstName, lastName, role, confirmPassword });
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['email', 'password', 'firstName', 'lastName', 'role', 'confirmPassword']
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      console.log('Passwords do not match:', { password, confirmPassword });
      return res.status(400).json({ 
        message: "Passwords don't match"
      });
    }

    // Check if user already exists
    console.log('Checking for existing user with email:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', existingUser);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    console.log('Creating new user...');
    const user = new User({
      email,
      password, // Password will be hashed by the pre-save middleware
      role,
      profile: {
        firstName,
        lastName
      },
      ...(role === 'employer' && { company })
    });

    console.log('Saving user to database...');
    await user.save();

    // Generate JWT token
    console.log('Generating JWT token...');
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Registration successful!');
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Error registering user',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    console.log('Login request body:', req.body); // Debug log
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['email', 'password']
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Error logging in',
      error: error.message 
    });
  }
};

module.exports = {
  register,
  login
}; 