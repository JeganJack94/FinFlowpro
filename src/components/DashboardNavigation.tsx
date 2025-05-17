import React, { memo } from 'react';

interface StatusBarProps {
  timeDisplay: string;
}

// Memoized StatusBar component to prevent unnecessary re-renders
const StatusBar: React.FC<StatusBarProps> = memo(({ timeDisplay }) => {
  return (
    <div className="fixed top-0 w-full bg-white dark:bg-gray-800 z-10 shadow-sm will-change-transform">
      <div className="flex justify-between items-center p-3">
        <div className="text-sm font-medium text-gray-800 dark:text-white">{timeDisplay}</div>
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-signal text-gray-800 dark:text-white"></i>
          <i className="fa-solid fa-wifi text-gray-800 dark:text-white"></i>
          <i className="fa-solid fa-battery-three-quarters text-gray-800 dark:text-white"></i>
        </div>
      </div>
    </div>
  );
});

interface BottomNavigationProps {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

// Memoized BottomNavigation component to prevent unnecessary re-renders
const BottomNavigation: React.FC<BottomNavigationProps> = memo(({ selectedTab, setSelectedTab }) => {
  return (
    <div className="fixed bottom-0 w-full bg-white dark:bg-gray-800 shadow-lg z-10 will-change-transform">
      <div className="grid grid-cols-4 h-16">
        <div
          className={`flex flex-col items-center justify-center cursor-pointer ${selectedTab === 'home' ? 'text-purple-500' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setSelectedTab('home')}
        >
          <i className="fa-solid fa-house text-xl"></i>
          <span className="text-xs mt-1">Home</span>
        </div>
        <div
          className={`flex flex-col items-center justify-center cursor-pointer ${selectedTab === 'analytics' ? 'text-purple-500' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setSelectedTab('analytics')}
        >
          <i className="fa-solid fa-chart-pie text-xl"></i>
          <span className="text-xs mt-1">Analytics</span>
        </div>
        <div
          className={`flex flex-col items-center justify-center cursor-pointer ${selectedTab === 'goals' ? 'text-purple-500' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setSelectedTab('goals')}
        >
          <i className="fa-solid fa-bullseye text-xl"></i>
          <span className="text-xs mt-1">Goals</span>
        </div>
        <div
          className={`flex flex-col items-center justify-center cursor-pointer ${selectedTab === 'profile' ? 'text-purple-500' : 'text-gray-500 dark:text-gray-400'}`}
          onClick={() => setSelectedTab('profile')}
        >
          <i className="fa-solid fa-user text-xl"></i>
          <span className="text-xs mt-1">Profile</span>
        </div>
      </div>
    </div>
  );
});

// Add display names for better debugging
StatusBar.displayName = 'StatusBar';
BottomNavigation.displayName = 'BottomNavigation';

export { StatusBar, BottomNavigation };
