import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchJobRecommendations } from '../../store/slices/jobSlice';

const JobRecommendations = () => {
  const dispatch = useDispatch();
  const { recommendations, loading, error } = useSelector((state) => state.jobs);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user?.role === 'jobseeker') {
      dispatch(fetchJobRecommendations());
    }
  }, [dispatch, user?.role]);

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

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">No recommendations available</h3>
        <p className="mt-2 text-sm text-gray-500">Complete your profile to get personalized job recommendations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Recommended Jobs</h2>
        <p className="text-sm text-gray-500">Based on your profile and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recommendations.map((job) => (
          <div key={job._id} className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900">
              <Link to={`/jobs/${job._id}`} className="hover:text-blue-600">
                {job.title}
              </Link>
            </h3>
            <p className="mt-1 text-sm text-gray-500">{job.company}</p>
            
            <div className="mt-2 flex items-center space-x-4">
              <span className="text-sm text-gray-500">{job.location}</span>
              <span className="text-sm text-gray-500">{job.jobType}</span>
              <span className="text-sm text-gray-500">
                ${job.salary?.min} - ${job.salary?.max}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {job.requirements?.[0]?.skills?.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {skill}
                </span>
              ))}
            </div>

            {job.matchScore && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Match Score</span>
                  <span className="text-sm font-medium text-blue-600">
                    {Math.round(job.matchScore * 100)}%
                  </span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${job.matchScore * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {job.skillMatch && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900">Matching Skills</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {job.skillMatch.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {job.missingSkills && job.missingSkills.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900">Missing Skills</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {job.missingSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobRecommendations; 