import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchJobById, applyForJob } from '../../store/slices/jobSlice';

const JobDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { currentJob: job, loading, error } = useSelector((state) => state.jobs);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!jobId) {
      navigate('/jobs');
      return;
    }
    dispatch(fetchJobById(jobId));
  }, [dispatch, jobId, navigate]);

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await dispatch(applyForJob(jobId)).unwrap();
      // Show success message or redirect
    } catch (err) {
      // Error is handled by the reducer
    }
  };

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

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Job not found</h2>
        <p className="mt-2 text-gray-600">The job you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <p className="mt-1 text-xl text-gray-500">{job.company}</p>
              <div className="mt-2 flex items-center space-x-4">
                <span className="text-sm text-gray-500">{job.location}</span>
                <span className="text-sm text-gray-500">{job.jobType}</span>
                <span className="text-sm text-gray-500">
                  ${job.salary?.min || 0} - ${job.salary?.max || 0} {job.salary?.currency || 'USD'}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm text-gray-500">
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </span>
              {user?.role === 'jobseeker' && (
                <button
                  onClick={handleApply}
                  className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold text-gray-900">Job Description</h2>
              <div className="mt-4 prose prose-blue max-w-none">
                <p className="text-gray-600 whitespace-pre-wrap">{job.description}</p>
              </div>

              <h2 className="mt-8 text-xl font-semibold text-gray-900">Requirements</h2>
              <div className="mt-4">
                <ul className="list-disc pl-5 space-y-2">
                  {job.requirements?.map((req, index) => (
                    <li key={index} className="text-gray-600">
                      <p>Experience: {req.experience}</p>
                      <p>Education: {req.education}</p>
                      <p>Skills: {req.skills?.join(', ')}</p>
                      {req.certifications && req.certifications.length > 0 && (
                        <p>Certifications: {req.certifications.join(', ')}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <h2 className="mt-8 text-xl font-semibold text-gray-900">Responsibilities</h2>
              <div className="mt-4">
                <ul className="list-disc pl-5 space-y-2">
                  {job.responsibilities?.map((resp, index) => (
                    <li key={index} className="text-gray-600">{resp}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="md:col-span-1">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900">Job Details</h3>
                <dl className="mt-4 space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Experience Level</dt>
                    <dd className="mt-1 text-sm text-gray-900">{job.experience}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Job Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{job.jobType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">{job.location}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Salary Range</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      ${job.salary?.min || 0} - ${job.salary?.max || 0} {job.salary?.currency || 'USD'}
                    </dd>
                  </div>
                  {job.benefits && job.benefits.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Benefits</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        <ul className="list-disc pl-5 space-y-1">
                          {job.benefits.map((benefit, index) => (
                            <li key={index}>{benefit}</li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {user?.role === 'employer' && job.employer?._id === user._id && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900">Applications</h3>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">
                      {job.applications?.length || 0} applications received
                    </p>
                    <button
                      onClick={() => navigate(`/jobs/${jobId}/applications`)}
                      className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Applications
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail; 