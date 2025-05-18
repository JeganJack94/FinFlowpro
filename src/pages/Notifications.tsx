import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, writeBatch, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Notifications: React.FC = () => {
  const { getCategoryIcon } = useFinance();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch notifications from Firestore
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    
    // Set up real-time listener for notifications
    const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const userNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(userNotifications);
      setLoading(false);
      console.log('Fetched notifications:', userNotifications.length);
    });
    
    return () => {
      console.log('Unsubscribing from notifications listener');
      unsubscribe();
    };
  }, [currentUser, navigate]);

  // Mark notification as read
  const markAsRead = async (notification: any) => {
    if (!currentUser || notification.read) return;
    
    try {
      // Check if the notification still exists before updating
      const notificationRef = doc(db, 'users', currentUser.uid, 'notifications', notification.id);
      
      // First get the document to check if it exists
      const docSnap = await getDoc(notificationRef);
      
      if (docSnap.exists()) {
        // Document exists, safe to update
        await updateDoc(notificationRef, {
          read: true,
          // Don't update timestamp as we want to preserve the original order
        });
        console.log('Marked notification as read:', notification.id);
      } else {
        console.log('Notification no longer exists:', notification.id);
        // Refresh notifications list to remove the deleted notification
        // The onSnapshot listener will automatically update the list
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser) return;
    
    const unreadNotifications = notifications.filter(notif => !notif.read);
    if (unreadNotifications.length === 0) return;
    
    try {
      // First, check which notifications still exist
      const validNotifications = [];
      
      for (const notif of unreadNotifications) {
        const notificationRef = doc(db, 'users', currentUser.uid, 'notifications', notif.id);
        const docSnap = await getDoc(notificationRef);
        
        if (docSnap.exists()) {
          validNotifications.push(notif);
        }
      }
      
      if (validNotifications.length === 0) {
        console.log('No valid notifications to mark as read');
        return;
      }
      
      // Use a batch for better performance
      const batch = writeBatch(db);
      
      validNotifications.forEach(notif => {
        const notificationRef = doc(db, 'users', currentUser.uid, 'notifications', notif.id);
        batch.update(notificationRef, { read: true });
      });
      
      await batch.commit();
      console.log(`Marked ${validNotifications.length} notifications as read`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = async () => {
    if (!currentUser || notifications.length === 0) return;
    
    try {
      // Show confirmation before deleting
      if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
        setLoading(true); // Show loading state
        console.log('Clearing notifications:', notifications.length);
        
        // Get all valid notification IDs first to avoid errors with non-existent documents
        const validNotificationIds = [];
        
        // Check each notification to make sure it exists before trying to delete it
        for (const notification of notifications) {
          const notificationRef = doc(db, 'users', currentUser.uid, 'notifications', notification.id);
          const docSnap = await getDoc(notificationRef);
          if (docSnap.exists()) {
            validNotificationIds.push(notification.id);
          }
        }
        
        if (validNotificationIds.length === 0) {
          console.log('No valid notifications to delete');
          setLoading(false);
          return;
        }
        
        console.log(`Found ${validNotificationIds.length} valid notifications to delete`);
        
        // For better performance with large numbers of items, process in chunks
        const BATCH_SIZE = 300; // Firestore has a limit of 500 operations per batch
        
        // Process notifications in chunks to stay within Firestore limits
        for (let i = 0; i < validNotificationIds.length; i += BATCH_SIZE) {
          const batch = writeBatch(db);
          const chunkIds = validNotificationIds.slice(i, i + BATCH_SIZE);
          
          // Add deletions to batch
          chunkIds.forEach(id => {
            const notificationRef = doc(db, 'users', currentUser.uid, 'notifications', id);
            batch.delete(notificationRef);
          });
          
          // Execute this batch
          await batch.commit();
          console.log(`Committed batch ${Math.floor(i/BATCH_SIZE) + 1}, deleted ${chunkIds.length} notifications`);
        }
        
        // Set loading to false once all deletes are complete
        setLoading(false);
        // Don't need to manually update state as onSnapshot will handle it
        console.log('Notifications cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      setLoading(false);
      // Display error to user
      alert('There was an error clearing notifications. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={() => navigate('/')}
          >
            <i className="fa-solid fa-arrow-left text-gray-600 dark:text-gray-300"></i>
          </button>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Notifications</h1>
          
          <div className="flex items-center gap-3">
            {notifications.filter(n => !n.read).length > 0 && (
              <button 
                className="text-sm text-purple-500 hover:text-purple-700 transition-colors font-medium"
                onClick={markAllAsRead}
              >
                Mark read
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
      
      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-4">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : notifications.length === 0 ? (
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
                    .map(notification => (
                      <motion.div 
                        key={notification.id} 
                        className="bg-purple-50 dark:bg-purple-900/20 rounded-lg shadow-sm p-4 mb-2"
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
                              {typeof notification.timestamp === 'object' && notification.timestamp?.toDate 
                                ? notification.timestamp.toDate().toLocaleString() 
                                : new Date().toLocaleString()}
                            </div>
                          </div>
                          <div className="ml-auto pl-2 flex items-center">
                            <button 
                              className="w-8 h-8 rounded-full bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 flex items-center justify-center transition-colors"
                              onClick={() => markAsRead(notification)}
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
                    .map(notification => (
                      <motion.div 
                        key={notification.id} 
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-2"
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
                              {typeof notification.timestamp === 'object' && notification.timestamp?.toDate 
                                ? notification.timestamp.toDate().toLocaleString() 
                                : new Date().toLocaleString()}
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
    </div>
  );
};

export default Notifications;