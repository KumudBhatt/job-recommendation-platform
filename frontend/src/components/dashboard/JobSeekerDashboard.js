import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchJobs, fetchJobRecommendations, fetchApplications } from '../../store/slices/jobSlice';
import { getCurrentUser } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';

const JobSeekerDashboard = () => {
  const dispatch = useDispatch();
  const { jobs, recommendations, applications, loading, error } = useSelector((state) => state.jobs);
  const { user, profile } = useSelector((state) => state.auth);
  const [dataFetched, setDataFetched] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (dataFetched) return;

      try {
        await Promise.all([
          dispatch(getCurrentUser()),
          dispatch(fetchJobs()),
          dispatch(fetchJobRecommendations()),
          dispatch(fetchApplications())
        ]);
        setDataFetched(true);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data. Please try again.');
      }
    };

    if (user?.role === 'jobseeker') {
      fetchData();
    }
  }, [dispatch, user?.role, dataFetched]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Calculate statistics
  const totalJobs = jobs?.length || 0;
  const totalApplications = applications?.length || 0;
  const pendingApplications = applications?.filter(app => app.status === 'pending').length || 0;
  const acceptedApplications = applications?.filter(app => app.status === 'accepted').length || 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Check for recommendation message
  let recommendationMessage = null;
  if (Array.isArray(recommendations) && recommendations.length > 0 && recommendations[0].message) {
    recommendationMessage = recommendations[0].message;
  } else if (recommendations && recommendations.message) {
    recommendationMessage = recommendations.message;
  }

  // Get jobs array from recommendations
  let recommendedJobs = [];
  if (Array.isArray(recommendations)) {
    recommendedJobs = recommendations;
  } else if (recommendations && Array.isArray(recommendations.jobs)) {
    recommendedJobs = recommendations.jobs;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {user?.name}</h1>

      {/* Recommendation Message */}
      {recommendationMessage && (
        <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
          <p>{recommendationMessage}</p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Jobs</h3>
          <p className="text-3xl font-bold text-blue-600">{totalJobs}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Total Applications</h3>
          <p className="text-3xl font-bold text-green-600">{totalApplications}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Pending Applications</h3>
          <p className="text-3xl font-bold text-yellow-600">{pendingApplications}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700">Accepted Applications</h3>
          <p className="text-3xl font-bold text-purple-600">{acceptedApplications}</p>
        </div>
      </div>

      {/* Recommended Jobs */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recommended Jobs</h2>
        {recommendedJobs?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedJobs.map((job) => (
              <div key={job._id} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                <p className="text-gray-600 mb-4">{job.company}</p>
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Match Score: {job.matchScore || 0}%</p>
                  {job.skillMatch?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-semibold">Matching Skills:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {job.skillMatch.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Link
                  to={`/jobs/${job._id}`}
                  className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-center"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No recommended jobs available.</p>
        )}
      </div>

      {/* Recent Applications */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Applications</h2>
        {applications?.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((application) => (
                  <tr key={application._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{application.job?.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{application.job?.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${application.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                          application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-700">
            <p>You haven't applied to any jobs yet. Browse the recommended jobs above to find opportunities that match your skills.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSeekerDashboard; 