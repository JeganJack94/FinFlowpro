import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { motion } from 'framer-motion';

// Type-safe notification type
export type LocalNotification = {
  id: string;
  title: string;
  message: string;
  category?: string;
  read: boolean;
  timestamp: number;
};

const LOCAL_NOTIFICATIONS_KEY = 'finflow_local_notifications';

function getLocalNotifications(): LocalNotification[] {
  try {
    const data = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalNotifications(notifications: LocalNotification[]) {
  localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

// Accept onClose prop for modal close
interface NotificationsProps {
  onClose?: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ onClose }) => {
  const { getCategoryIcon } = useFinance();
  const [notifications, setNotifications] = useState<LocalNotification[]>(() => getLocalNotifications());
  const [showConfirm, setShowConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync with localStorage changes (from other tabs/windows)
  useEffect(() => {
    function handleStorage() {
      setNotifications(getLocalNotifications());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Close modal on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose?.();
      }
    }
    if (onClose) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [onClose]);

  // Mark notification as read
  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveLocalNotifications(updated);
    setNotifications(updated);
  };

  // Mark all as read
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveLocalNotifications(updated);
    setNotifications(updated);
  };

  // Clear all notifications (show custom confirm modal)
  const clearAllNotifications = () => {
    if (notifications.length === 0) return;
    setShowConfirm(true);
  };
  const confirmClear = () => {
    saveLocalNotifications([]);
    setNotifications([]);
    setShowConfirm(false);
  };
  const cancelClear = () => setShowConfirm(false);

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-start pointer-events-none">
      {/* Overlay for click outside */}
      <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 transition-opacity pointer-events-auto" aria-hidden="true"></div>
      <div
        ref={modalRef}
        className="relative flex flex-col w-full max-w-sm bg-gradient-to-br from-gray-50/90 via-white/80 to-gray-100/90 dark:from-gray-900/80 dark:via-gray-800/90 dark:to-gray-900/80 rounded-xl shadow-xl z-10 mt-20 pointer-events-auto backdrop-blur-md"
        style={{ maxHeight: '28rem', minHeight: '30rem' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-transparent rounded-t-xl">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onClose && (
                <button
                  className="mr-2 text-gray-500 hover:text-purple-600 focus:outline-none"
                  onClick={onClose}
                  aria-label="Back"
                >
                  <i className="fa-solid fa-arrow-left"></i>
                </button>
              )}
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">Notifications</h1>
            </div>
            <div className="flex items-center gap-3">
              {notifications.some(n => !n.read) && (
                <button 
                  className="text-sm text-purple-500 hover:text-purple-700 transition-colors font-medium"
                  onClick={markAllAsRead}
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  className="text-sm text-red-500 hover:text-red-700 transition-colors font-medium"
                  onClick={clearAllNotifications}
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Main content: show only 4 notifications at a time, scrollable */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '30rem' }}>
          <div className="max-w-sm mx-auto px-4 py-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <i className="fa-solid fa-bell-slash text-4xl text-gray-300 dark:text-gray-600 mb-4"></i>
                  <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No notifications</h2>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xs">
                    You're all caught up! Check back later for updates on your budget and finances.
                  </p>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Unread notifications section */}
                {notifications.filter(n => !n.read).length > 0 && (
                  <>
                    <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">New</h2>
                    {notifications
                      .filter(notification => !notification.read)
                      .slice(0, 4)
                      .map(notification => (
                        <motion.div 
                          key={notification.id} 
                          className="bg-gradient-to-br from-purple-50/90 via-white/80 to-purple-100/90 dark:from-purple-900/40 dark:via-gray-900/60 dark:to-purple-900/30 rounded-lg shadow-sm p-4 mb-2 backdrop-blur-md"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-start">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3 flex-shrink-0">
                              <i className={`fa-solid ${notification.category ? getCategoryIcon(notification.category, 'expense') : 'fa-chart-pie'} text-purple-500`}></i>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-800 dark:text-white">{notification.title}</div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {new Date(notification.timestamp).toLocaleString()}
                              </div>
                            </div>
                            <div className="ml-auto pl-2 flex items-center">
                              <button 
                                className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 flex items-center justify-center transition-colors"
                                onClick={() => markAsRead(notification.id)}
                                aria-label="Mark as read"
                              >
                                <i className="fa-solid fa-check text-purple-600 text-sm"></i>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </>
                )}
                {/* Read notifications section */}
                {notifications.filter(n => n.read).length > 0 && (
                  <>
                    <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 mt-6 px-2">Earlier</h2>
                    {notifications
                      .filter(notification => notification.read)
                      .slice(0, 4)
                      .map(notification => (
                        <motion.div 
                          key={notification.id} 
                          className="bg-gradient-to-br from-gray-50/90 via-white/80 to-gray-100/90 dark:from-gray-900/40 dark:via-gray-800/60 dark:to-gray-900/30 rounded-lg shadow-sm p-4 mb-2 backdrop-blur-md"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex items-start">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3 flex-shrink-0">
                              <i className={`fa-solid ${notification.category ? getCategoryIcon(notification.category, 'expense') : 'fa-chart-pie'} text-purple-500`}></i>
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-800 dark:text-white">{notification.title}</div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {new Date(notification.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Custom confirm modal for clear all */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-gradient-to-br from-gray-50/90 via-white/80 to-gray-100/90 dark:from-gray-900/80 dark:via-gray-800/90 dark:to-gray-900/80 rounded-lg shadow-lg p-6 max-w-xs w-full backdrop-blur-md">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Clear all notifications?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={cancelClear}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                  onClick={confirmClear}
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;