import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Save, User, Settings, ArrowLeft } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/chat')}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile & Settings</h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Information */}
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <User className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-gray-50 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Email cannot be changed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-center">
          <button
            disabled
            className="px-8 py-3 bg-gray-300 dark:bg-gray-600 text-white rounded-lg transition-colors flex items-center space-x-2 cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            <span>Save Changes</span>
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Settings className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-green-900 dark:text-green-100">API Keys Available</h3>
              <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                Default API keys are configured for all users. You can override these with your own keys if needed. 
                The system will use your personal keys if provided, otherwise it will use the default keys.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 