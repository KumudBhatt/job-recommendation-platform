const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/resumes');
mkdir(uploadsDir, { recursive: true }).catch(console.error);

// Function to save file to local storage
const saveToLocal = async (file, userId) => {
  try {
    // Create user-specific directory
    const userDir = path.join(uploadsDir, userId);
    await mkdir(userDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    const filepath = path.join(userDir, filename);

    // Save file
    await writeFile(filepath, file.buffer);

    // Return relative path for database storage
    return `/uploads/resumes/${userId}/${filename}`;
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Failed to save file');
  }
};

// Function to parse resume content
const parseResume = async (buffer) => {
  // TODO: Implement resume parsing logic
  // For now, return empty object
  return {};
};

module.exports = {
  saveToLocal,
  parseResume
}; 