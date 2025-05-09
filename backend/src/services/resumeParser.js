const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

// Basic text extraction without AI service
const extractBasicInfo = (text) => {
  // Split text into lines and remove empty lines
  const lines = text.split('\n').filter(line => line.trim());
  
  // Basic information extraction
  const info = {
    name: lines[0] || 'Unknown', // First line is usually the name
    email: lines.find(line => line.includes('@')) || '',
    phone: lines.find(line => /\d{10}/.test(line)) || '',
    skills: [],
    experience: [],
    education: []
  };

  // Extract skills (looking for common skill keywords)
  const skillKeywords = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker', 'git'];
  lines.forEach(line => {
    const words = line.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (skillKeywords.includes(word)) {
        info.skills.push(word);
      }
    });
  });

  // Remove duplicates
  info.skills = [...new Set(info.skills)];

  return info;
};

// Parse resume content based on file type
const parseResume = async (filePath, fileType) => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const fileExtension = filePath.split('.').pop().toLowerCase();
    
    let text;
    if (fileExtension === 'pdf') {
      const data = await pdf(fileBuffer);
      text = data.text;
    } else if (['doc', 'docx'].includes(fileExtension)) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      text = result.value;
    } else {
      throw new Error('Unsupported file type');
    }

    // Try to use AI service if available
    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL;
      if (aiServiceUrl) {
        console.log('Attempting to use AI service for resume parsing...');
        // Convert file buffer to base64
        const base64Content = fileBuffer.toString('base64');
        
        const response = await fetch(`${aiServiceUrl}/parse-resume`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resumeId: filePath.split('/').pop().replace(/\.[^/.]+$/, ''),
            fileContent: base64Content,
            fileType: fileType
          })
        });

        if (response.ok) {
          const parsedData = await response.json();
          console.log('AI service successfully parsed resume:', {
            name: parsedData.name,
            email: parsedData.email,
            skillsCount: parsedData.skills.length,
            experienceCount: parsedData.experience.length,
            educationCount: parsedData.education.length
          });
          return parsedData;
        } else {
          const errorData = await response.json();
          console.error('AI service error:', errorData);
          throw new Error(errorData.message || 'Failed to parse resume with AI service');
        }
      }
    } catch (aiError) {
      console.warn('AI service unavailable, falling back to basic parsing:', aiError.message);
    }

    // Fallback to basic parsing
    console.log('Using basic resume parsing...');
    const basicInfo = extractBasicInfo(text);
    console.log('Basic parsing results:', {
      name: basicInfo.name,
      email: basicInfo.email,
      skillsCount: basicInfo.skills.length,
      experienceCount: basicInfo.experience.length,
      educationCount: basicInfo.education.length
    });
    return basicInfo;
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error('Failed to parse resume');
  }
};

module.exports = {
  parseResume
}; 