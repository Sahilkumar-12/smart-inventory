import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { toast } from 'react-toastify';
import { Settings as SettingsIcon, User, Lock, LogOut, Eye, EyeOff } from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Profile Form State
  const [profileData, setProfileData] = useState({
    email: '',
    display_name: ''
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileEditing, setProfileEditing] = useState(false);

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await authService.getCurrentUser();
      setProfileData({
        email: res.data.email || '',
        display_name: res.data.display_name || ''
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatePayload = {};
      if (profileData.email) updatePayload.email = profileData.email;
      if (profileData.display_name) updatePayload.display_name = profileData.display_name;

      if (Object.keys(updatePayload).length === 0) {
        toast.warning('No changes to save');
        setLoading(false);
        return;
      }

      await authService.updateProfile(updatePayload);
      toast.success('Profile updated successfully!');
      setProfileEditing(false);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!passwordData.old_password || !passwordData.new_password || !passwordData.confirm_password) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.old_password === passwordData.new_password) {
      toast.error('New password must be different from old password');
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      toast.success('Password changed successfully!');
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 pb-6 z-10 bg-gradient-to-b from-gray-50 to-transparent dark:from-dark-bg dark:to-transparent">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-xl shadow-inner border border-blue-200 dark:border-blue-800">
          <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium">
            Manage your account and preferences
          </p>
        </div>
      </div>

      {/* Profile Section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary-100 dark:bg-primary-900/30 p-2.5 rounded-lg border border-primary-200 dark:border-primary-800">
            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Information</h2>
        </div>

        {profileLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-1">Username</p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white">{user?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-1">Account Status</p>
                  <p className="text-lg font-medium">
                    <span className="px-3 py-1 rounded-full inline-block bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400 text-sm font-semibold">
                      Active
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {profileEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="display_name"
                    value={profileData.display_name}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                    placeholder="Enter your display name"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileEditing(false);
                      fetchUserProfile();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-1">Email</p>
                    <p className="text-gray-900 dark:text-white">{profileData.email || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold mb-1">Display Name</p>
                    <p className="text-gray-900 dark:text-white">{profileData.display_name || 'Not set'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setProfileEditing(true)}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
                >
                  Edit Profile
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Change Password Section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-100 dark:bg-orange-900/30 p-2.5 rounded-lg border border-orange-200 dark:border-orange-800">
            <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Change Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.old ? 'text' : 'password'}
                name="old_password"
                value={passwordData.old_password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, old: !prev.old }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPasswords.old ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="Enter new password (min 6 characters)"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {loading ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Logout Section */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100 dark:bg-red-900/30 p-2.5 rounded-lg border border-red-200 dark:border-red-800">
            <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Logout</h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Sign out of your account. You'll need to login again to access your inventory.
        </p>

        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Settings;
