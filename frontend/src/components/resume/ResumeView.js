import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchResume } from '../../store/slices/resumeSlice';

const ResumeView = () => {
  const dispatch = useDispatch();
  const { resume, loading, error } = useSelector((state) => state.resume);

  useEffect(() => {
    dispatch(fetchResume());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">No Resume Found</h2>
        <p className="mt-2 text-gray-600">Please upload your resume to view it here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Resume Header */}
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{resume.name}</h1>
              <p className="mt-1 text-gray-500">{resume.email}</p>
              <p className="text-gray-500">{resume.phone}</p>
              <p className="text-gray-500">{resume.location}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-sm text-gray-900">
                {new Date(resume.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Resume Content */}
        <div className="px-4 py-5 sm:px-6">
          <div className="space-y-8">
            {/* Summary */}
            <div>
              <h2 className="text-lg font-medium text-gray-900">Professional Summary</h2>
              <p className="mt-2 text-gray-600">{resume.summary}</p>
            </div>

            {/* Experience */}
            <div>
              <h2 className="text-lg font-medium text-gray-900">Work Experience</h2>
              <div className="mt-4 space-y-6">
                {resume.experience.map((exp, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-md font-medium text-gray-900">{exp.title}</h3>
                    <p className="text-sm text-gray-500">{exp.company}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(exp.startDate).toLocaleDateString()} -{' '}
                      {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
                    </p>
                    <ul className="mt-2 list-disc pl-5 space-y-1">
                      {exp.responsibilities.map((resp, idx) => (
                        <li key={idx} className="text-sm text-gray-600">{resp}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div>
              <h2 className="text-lg font-medium text-gray-900">Education</h2>
              <div className="mt-4 space-y-4">
                {resume.education.map((edu, index) => (
                  <div key={index}>
                    <h3 className="text-md font-medium text-gray-900">{edu.degree}</h3>
                    <p className="text-sm text-gray-500">{edu.institution}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(edu.startDate).toLocaleDateString()} -{' '}
                      {edu.endDate ? new Date(edu.endDate).toLocaleDateString() : 'Present'}
                    </p>
                    {edu.gpa && (
                      <p className="text-sm text-gray-500">GPA: {edu.gpa}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div>
              <h2 className="text-lg font-medium text-gray-900">Skills</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {resume.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            {resume.certifications && resume.certifications.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900">Certifications</h2>
                <div className="mt-4 space-y-4">
                  {resume.certifications.map((cert, index) => (
                    <div key={index}>
                      <h3 className="text-md font-medium text-gray-900">{cert.name}</h3>
                      <p className="text-sm text-gray-500">{cert.issuer}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(cert.date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {resume.projects && resume.projects.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900">Projects</h2>
                <div className="mt-4 space-y-6">
                  {resume.projects.map((project, index) => (
                    <div key={index}>
                      <h3 className="text-md font-medium text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500">{project.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {project.technologies.map((tech, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resume Actions */}
        <div className="px-4 py-4 sm:px-6 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => window.open(resume.fileUrl, '_blank')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Original Resume
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Print Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeView; 