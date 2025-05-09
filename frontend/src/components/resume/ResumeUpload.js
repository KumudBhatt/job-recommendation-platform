import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uploadResume, fetchResume } from '../../store/slices/resumeSlice';
import { toast } from 'react-toastify';

const ResumeUpload = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { resume = null, loading = false, error = null } = useSelector((state) => state.resume || {});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to upload your resume');
      navigate('/login');
      return;
    }
    dispatch(fetchResume());
  }, [dispatch, navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file size (5MB limit)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Only PDF and Word documents are allowed');
        return;
      }

      setFile(selectedFile);
      // Create preview URL for PDF or image
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      await dispatch(uploadResume(file)).unwrap();
      toast.success('Resume uploaded successfully');
      setFile(null);
      setPreview(null);
      // Refresh the resume list
      dispatch(fetchResume());
    } catch (error) {
      if (error.message === 'Unauthorized') {
        toast.error('Please login to upload your resume');
        navigate('/login');
      } else {
        console.error('Upload error:', error);
        toast.error(error.message || 'Failed to upload resume. Please try again.');
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Upload Resume</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Resume (PDF or Word)
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <p className="mt-1 text-sm text-gray-500">
            Maximum file size: 5MB. Supported formats: PDF, DOC, DOCX
          </p>
        </div>

        {preview && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">Preview:</p>
            {file.type === 'application/pdf' ? (
              <iframe
                src={preview}
                className="w-full h-64 border rounded"
                title="PDF Preview"
              />
            ) : (
              <p className="text-sm text-gray-500">{file.name}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className={`w-full py-2 px-4 rounded-md text-white font-medium
            ${loading || !file
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {loading ? 'Uploading...' : 'Upload Resume'}
        </button>
      </form>

      {resume && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Current Resume</h3>
          <p className="text-sm text-gray-600">{resume.title || resume.fileName}</p>
          <a
            href={`/api/resumes/${resume._id}/download`}
            className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download Current Resume
          </a>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload; 