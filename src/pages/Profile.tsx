import React, { useState, useEffect } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, updatePassword, updateEmail } from 'firebase/auth';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebase';
import UserManualModal from '../components/UserManualModal';

const Profile: React.FC = () => {
  const { darkMode, toggleDarkMode } = useFinance();
  const { currentUser, logout } = useAuth();
  
  // State for security modal
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState(currentUser?.displayName || '');
  const [newEmail, setNewEmail] = useState(currentUser?.email || '');
  const [securityError, setSecurityError] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  
  // State for notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem('notifications') === 'true'
  );
  
  // State for help & support modal
  const [showSupportModal, setShowSupportModal] = useState(false);
  
  // State for user manual modal
  const [showUserManualModal, setShowUserManualModal] = useState(false);

  // Update display name when currentUser changes
  useEffect(() => {
    if (currentUser?.displayName) {
      setNewDisplayName(currentUser.displayName);
    }
    if (currentUser?.email) {
      setNewEmail(currentUser.email);
    }
  }, [currentUser]);

  // Toggle notifications
  const handleToggleNotifications = async () => {
    const newState = !notificationsEnabled;
    setNotificationsEnabled(newState);
    localStorage.setItem('notifications', newState.toString());
    
    if (newState && "Notification" in window) {
      // Request permission for browser notifications if enabling
      Notification.requestPermission();
    } else if (!newState && currentUser) {
      try {
        // If disabling notifications, clear all unread notifications
        const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
        const notificationsQuery = query(notificationsRef, where('read', '==', false));
        const querySnapshot = await getDocs(notificationsQuery);
        
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
          // Mark all as read instead of deleting to preserve history
          batch.update(doc.ref, { read: true });
        });
        
        // Also reset notification status for all budget limits
        const budgetLimitsRef = collection(db, 'users', currentUser.uid, 'budgetLimits');
        const budgetLimitsQuery = query(budgetLimitsRef);
        const budgetSnapshot = await getDocs(budgetLimitsQuery);
        
        budgetSnapshot.forEach((doc) => {
          // Reset notification sent flag
          batch.update(doc.ref, { notificationSent: false });
        });
        
        await batch.commit();
      } catch (error) {
        console.error("Error clearing notifications:", error);
      }
    }
  };

  // Handle dark mode toggle with immediate visual feedback
  const handleDarkModeToggle = () => {
    toggleDarkMode();
    // This will immediately toggle the dark class on the HTML element
    document.documentElement.classList.toggle('dark');
  };

  // Update profile information
  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    
    setSecurityError('');
    setSecuritySuccess('');
    
    try {
      // Update display name if changed
      if (newDisplayName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: newDisplayName });
      }
      
      // Update email if changed
      if (newEmail !== currentUser.email) {
        await updateEmail(currentUser, newEmail);
      }
      
      // Update password if provided
      if (newPassword) {
        await updatePassword(currentUser, newPassword);
        setNewPassword('');
      }
      
      setSecuritySuccess('Profile updated successfully!');
      setTimeout(() => {
        setShowSecurityModal(false);
        setSecuritySuccess('');
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setSecurityError(errorMessage);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await logout();
      // Navigation will be handled by the AuthRedirect component
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 transform transition-all duration-300 hover:shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-4">
              <span className="text-2xl font-bold text-purple-500">
                {currentUser?.displayName?.charAt(0).toUpperCase() || 
                 currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {currentUser?.displayName || 'User'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
            </div>
          </div>
          <div className="bg-purple-100 dark:bg-purple-900 px-3 py-1 rounded-full text-purple-500 text-xs font-medium">
            Pro User
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md transform transition-all duration-300 hover:shadow-lg">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Settings</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                <i className="fa-solid fa-moon text-purple-500"></i>
              </div>
              <span className="text-gray-800 dark:text-white">Dark Mode</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={darkMode}
                onChange={handleDarkModeToggle}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
            </label>
          </div>
          
          {/* Notifications Toggle */}
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                <i className="fa-solid fa-bell text-purple-500"></i>
              </div>
              <span className="text-gray-800 dark:text-white">Notifications</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notificationsEnabled}
                onChange={handleToggleNotifications}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
            </label>
          </div>

          {/* Security Settings */}
          <div 
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
            onClick={() => setShowSecurityModal(true)}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                <i className="fa-solid fa-lock text-purple-500"></i>
              </div>
              <span className="text-gray-800 dark:text-white">Security</span>
            </div>
            <i className="fa-solid fa-chevron-right text-gray-400"></i>
          </div>

          {/* User Manual */}
          <div 
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
            onClick={() => setShowUserManualModal(true)}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                <i className="fa-solid fa-book text-purple-500"></i>
              </div>
              <span className="text-gray-800 dark:text-white">User Manual</span>
            </div>
            <i className="fa-solid fa-chevron-right text-gray-400"></i>
          </div>

          {/* Help & Support */}
          <div 
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
            onClick={() => setShowSupportModal(true)}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                <i className="fa-solid fa-circle-question text-purple-500"></i>
              </div>
              <span className="text-gray-800 dark:text-white">Help & Support</span>
            </div>
            <i className="fa-solid fa-chevron-right text-gray-400"></i>
          </div>

          {/* Logout */}
          <div 
            className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
            onClick={handleSignOut}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mr-3">
                <i className="fa-solid fa-right-from-bracket text-red-500"></i>
              </div>
              <span className="text-red-500 font-medium">Log Out</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-5 relative">
            <button 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setShowSecurityModal(false)}
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Security Settings</h3>
            
            {securityError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {securityError}
              </div>
            )}
            
            {securitySuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                {securitySuccess}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                />
              </div>
              
              <button
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg transition-colors duration-200"
                onClick={handleUpdateProfile}
              >
                Update Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Manual Modal */}
      <UserManualModal
        showModal={showUserManualModal}
        onClose={() => setShowUserManualModal(false)}
      />

      {/* Help & Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-5 relative max-h-[90vh] overflow-y-auto">
            <button 
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setShowSupportModal(false)}
            >
              <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Help & Support</h3>
            
            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 font-medium text-gray-800 dark:text-white">
                  How do I add a new transaction?
                </div>
                <div className="p-4 text-gray-700 dark:text-gray-300">
                  To add a new transaction, tap the + button at the bottom of the screen, 
                  select the transaction type, fill in the details, and tap "Save".
                </div>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 font-medium text-gray-800 dark:text-white">
                  How can I edit or delete a transaction?
                </div>
                <div className="p-4 text-gray-700 dark:text-gray-300">
                  To edit or delete a transaction, go to the Transactions tab, find the transaction 
                  you want to modify, then tap on it to see options for editing or deleting.
                </div>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 font-medium text-gray-800 dark:text-white">
                  Can I export my financial data?
                </div>
                <div className="p-4 text-gray-700 dark:text-gray-300">
                  Yes, you can export your data by going to the Analytics tab and tapping the 
                  export icon in the top-right corner. You can choose to export as CSV or PDF.
                </div>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 font-medium text-gray-800 dark:text-white">
                  Is my financial data secure?
                </div>
                <div className="p-4 text-gray-700 dark:text-gray-300">
                  Yes, all your data is encrypted and securely stored. We use industry-standard 
                  security practices and do not share your information with third parties.
                </div>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 font-medium text-gray-800 dark:text-white">
                  How do I set up budget limits?
                </div>
                <div className="p-4 text-gray-700 dark:text-gray-300">
                  Go to the Budget tab, tap "Add Budget Limit", select a category, 
                  enter your monthly limit amount, and save. You'll receive notifications 
                  when you approach your limits.
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-800 dark:text-white mb-2">Need more help?</h4>
                <p className="text-gray-700 dark:text-gray-300">
                  Contact us at <a href="mailto:support@finflow.com" className="text-purple-500">support@finflow.com</a> 
                  for additional assistance. We typically respond within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copyright Footer */}
      <footer className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400 pb-4">
        <p>© {new Date().getFullYear()} Wintech - Finflow. All rights reserved.</p>
        <p className="mt-1">Version 1.0.0</p>
      </footer>
    </div>
  );
};

export default Profile;
