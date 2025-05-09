const nodemailer = require('nodemailer');

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset Request</h1>
      <p>You have requested to reset your password. Click the link below to proceed:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send welcome email
const sendWelcomeEmail = async (email, firstName) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Welcome to Job Recommendation Platform',
    html: `
      <h1>Welcome ${firstName}!</h1>
      <p>Thank you for joining our platform. We're excited to help you find your dream job.</p>
      <p>Here are some things you can do to get started:</p>
      <ul>
        <li>Complete your profile</li>
        <li>Upload your resume</li>
        <li>Browse job listings</li>
        <li>Set up job alerts</li>
      </ul>
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Best regards,<br>The Job Recommendation Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error('Failed to send welcome email');
  }
};

// Send job application confirmation
const sendApplicationConfirmation = async (email, jobTitle, companyName) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Job Application Confirmation',
    html: `
      <h1>Application Confirmation</h1>
      <p>Your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been received.</p>
      <p>We will review your application and get back to you soon.</p>
      <p>You can track your application status in your dashboard.</p>
      <p>Best regards,<br>The Job Recommendation Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending application confirmation:', error);
    throw new Error('Failed to send application confirmation');
  }
};

// Send job application status update
const sendApplicationStatusUpdate = async (email, jobTitle, companyName, status) => {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Application Status Update - ${jobTitle}`,
    html: `
      <h1>Application Status Update</h1>
      <p>Your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been ${status}.</p>
      <p>You can view more details in your dashboard.</p>
      <p>Best regards,<br>The Job Recommendation Team</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending application status update:', error);
    throw new Error('Failed to send application status update');
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendApplicationConfirmation,
  sendApplicationStatusUpdate
}; 