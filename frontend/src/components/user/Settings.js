import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserSettings } from '../../store/actions/userActions';
import { addToast } from '../common/ToastContainer';

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [settings, setSettings] = useState({
    emailNotifications: user?.settings?.emailNotifications ?? true,
    jobAlerts: user?.settings?.jobAlerts ?? true,
    profileVisibility: user?.settings?.profileVisibility ?? 'public',
    theme: user?.settings?.theme ?? 'light',
    language: user?.settings?.language ?? 'en'
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateUserSettings(settings));
      addToast('Settings updated successfully', 'success');
    } catch (error) {
      addToast(error.message || 'Failed to update settings', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Account Settings
          </h3>
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
              <div className="mt-2 space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="emailNotifications"
                      name="emailNotifications"
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={handleChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="emailNotifications" className="font-medium text-gray-700">
                      Receive email notifications
                    </label>
                    <p className="text-gray-500">
                      Get notified about job matches, application updates, and other important information.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="jobAlerts"
                      name="jobAlerts"
                      type="checkbox"
                      checked={settings.jobAlerts}
                      onChange={handleChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="jobAlerts" className="font-medium text-gray-700">
                      Job alerts
                    </label>
                    <p className="text-gray-500">
                      Receive alerts when new jobs matching your criteria are posted.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900">Profile Visibility</h4>
              <div className="mt-2">
                <select
                  id="profileVisibility"
                  name="profileVisibility"
                  value={settings.profileVisibility}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="recruiters">Recruiters Only</option>
                </select>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900">Appearance</h4>
              <div className="mt-2">
                <select
                  id="theme"
                  name="theme"
                  value={settings.theme}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900">Language</h4>
              <div className="mt-2">
                <select
                  id="language"
                  name="language"
                  value={settings.language}
                  onChange={handleChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings; 