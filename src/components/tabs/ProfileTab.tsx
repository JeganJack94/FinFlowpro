import React from 'react';

interface ProfileTabProps {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
}

// Use React.memo to prevent unnecessary re-renders
const ProfileTab: React.FC<ProfileTabProps> = React.memo(({
  darkMode,
  setDarkMode
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 flex flex-col items-center transform transition-all duration-300 hover:shadow-lg">
        <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-3">
          <i className="fa-solid fa-user text-3xl text-purple-500"></i>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Rahul Sharma</h2>
        <p className="text-gray-500 dark:text-gray-400">rahul.sharma@example.com</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md transform transition-all duration-300 hover:shadow-lg">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Settings</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
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
                onChange={() => setDarkMode(!darkMode)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                <i className="fa-solid fa-bell text-purple-500"></i>
              </div>
              <span className="text-gray-800 dark:text-white">Notifications</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                <i className="fa-solid fa-lock text-purple-500"></i>
              </div>
              <span className="text-gray-800 dark:text-white">Security</span>
            </div>
            <i className="fa-solid fa-chevron-right text-gray-400"></i>
          </div>
          
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                <i className="fa-solid fa-credit-card text-purple-500"></i>
              </div>
              <span className="text-gray-800 dark:text-white">Payment Methods</span>
            </div>
            <i className="fa-solid fa-chevron-right text-gray-400"></i>
          </div>
          
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                <i className="fa-solid fa-circle-question text-purple-500"></i>
              </div>
              <span className="text-gray-800 dark:text-white">Help & Support</span>
            </div>
            <i className="fa-solid fa-chevron-right text-gray-400"></i>
          </div>
          
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mr-3">
                <i className="fa-solid fa-right-from-bracket text-red-500"></i>
              </div>
              <span className="text-red-500">Log Out</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProfileTab;
