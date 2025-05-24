import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import GoalModal from '../components/GoalModal';
import ProgressUpdateModal from '../components/ProgressUpdateModal';
import { format } from 'date-fns';

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  category: string;
  note: string;
  userId: string;
  createdAt: import('firebase/firestore').Timestamp | null;
}

type Reminder = {
  id: string;
  title: string;
  date: string;
  type?: 'once' | 'monthly';
  time?: string;
  goalId?: string;
  createdAt?: string;
};

const Goals: React.FC = () => {
  const { formatCurrency } = useFinance();
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedGoalCategory, setSelectedGoalCategory] = useState<string | null>(null);
  const [currentGoal, setCurrentGoal] = useState<Goal | null>(null);
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);

  // --- Reminders state and handlers ---
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderType, setReminderType] = useState<'once' | 'monthly'>('once');
  const [reminderGoalId, setReminderGoalId] = useState<string>('');

  // --- Toast state ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }

  // Fetch reminders for all goals
  useEffect(() => {
    if (!currentUser || !goals.length) {
      setReminders([]);
      return;
    }
    // Listen to reminders for all goals
    const unsubscribes: (() => void)[] = [];
    let allReminders: Reminder[] = [];
    goals.forEach(goal => {
      const remindersQuery = collection(db, `users/${currentUser.uid}/goals/${goal.id}/reminders`);
      const unsubscribe = onSnapshot(remindersQuery, (snapshot) => {
        const remindersData: Reminder[] = [];
        snapshot.forEach(doc => {
          remindersData.push({ id: doc.id, ...doc.data(), goalId: goal.id } as Reminder);
        });
        // Replace reminders for this goal
        allReminders = allReminders.filter(r => r.goalId !== goal.id).concat(remindersData);
        // Sort by date desc
        allReminders.sort((a, b) => (b.date + (b.time || '')) < (a.date + (a.time || '')) ? -1 : 1);
        setReminders([...allReminders]);
      });
      unsubscribes.push(unsubscribe);
    });
    return () => { unsubscribes.forEach(u => u()); };
  }, [currentUser, goals]);

  useEffect(() => {
    if (!currentUser) {
      setGoals([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const goalsRef = collection(db, `users/${currentUser.uid}/goals`);
    const unsubscribe = onSnapshot(goalsRef, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
      setGoals(goalsData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  const handleAddNewGoal = useCallback((category?: string) => {
    setCurrentGoal(null);
    setSelectedGoalCategory(category || null);
    setShowGoalModal(true);
  }, []);

  const handleEditGoal = useCallback((goal: Goal) => {
    setCurrentGoal(goal);
    setSelectedGoalCategory(goal.category);
    setShowGoalModal(true);
  }, []);

  const handleSaveGoal = () => {
    // The goal is already saved to Firestore in the modal component
    // onSnapshot will handle updating the UI
    setSelectedGoalCategory(null);
    setCurrentGoal(null);
  };

  const handleOpenProgressModal = useCallback((goal: Goal) => {
    setProgressGoal(goal);
    setShowProgressModal(true);
  }, []);

  const handleUpdateGoalProgress = async (goalId: string, currentAmount: number) => {
    try {
      if (!currentUser) return;
      const goalRef = doc(db, `users/${currentUser.uid}/goals`, goalId);
      await updateDoc(goalRef, {
        current: currentAmount
      });
      // onSnapshot will handle updating the UI
    } catch (error) {
      console.error("Error updating goal progress:", error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        if (!currentUser) return;
        await deleteDoc(doc(db, `users/${currentUser.uid}/goals`, goalId));
        // onSnapshot will handle updating the UI
      } catch (error) {
        console.error("Error deleting goal:", error);
      }
    }
  };

  // Helper: Register reminder with service worker for push notification
  function registerReminderNotification(reminder: Reminder) {
    if ('serviceWorker' in navigator && 'showNotification' in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        // Send a message to the service worker to schedule the notification
        registration.active?.postMessage({
          type: 'schedule-reminder',
          reminder,
        });
      });
    }
  }

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle || !reminderDate || !reminderGoalId) return;
    if (!currentUser) return;
    try {
      const reminder = {
        title: reminderTitle,
        date: reminderDate,
        time: reminderTime,
        type: reminderType,
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, `users/${currentUser.uid}/goals/${reminderGoalId}/reminders`), reminder);
      // Register for push notification
      registerReminderNotification({ ...reminder, id: docRef.id, goalId: reminderGoalId });
      setReminderTitle('');
      setReminderDate('');
      setReminderTime('');
      setReminderType('once');
      setReminderGoalId('');
      setShowReminderModal(false);
      showToast('Reminder added!', 'success');
    } catch (err) {
      console.error('Error adding reminder:', err);
      showToast('Failed to add reminder', 'error');
    }
  }

  // Format reminder date and time for display
  function formatReminderDate(date: string, time?: string) {
    if (!date) return '';
    try {
      const dateObj = new Date(date + (time ? `T${time}` : ''));
      return format(dateObj, 'MMM dd, yyyy hh:mm a');
    } catch {
      return date + (time ? ` ${time}` : '');
    }
  }

  // Calculate days remaining and progress percentage
  const calculateDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.round((current / target) * 100);
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, string> = {
      'Home': 'fa-solid fa-house',
      'Vehicle': 'fa-solid fa-car',
      'Education': 'fa-solid fa-graduation-cap',
      'Vacation': 'fa-solid fa-umbrella-beach',
      'Travel': 'fa-solid fa-plane',
      'Investment': 'fa-solid fa-chart-line',
      'Gift': 'fa-solid fa-gift',
      'Savings': 'fa-solid fa-piggy-bank',
      'Electronics': 'fa-solid fa-laptop',
      'Other': 'fa-solid fa-heart'
    };
    
    return iconMap[category] || 'fa-solid fa-bullseye';
  };

  // --- Notification helpers (copy from Notifications.tsx or Home.tsx) ---
  interface LocalNotification {
    id: string;
    title: string;
    message: string;
    category?: string;
    timestamp: number;
    read: boolean;
  }
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
  function sendLocalNotification(notification: LocalNotification) {
    const notifications = getLocalNotifications();
    if (notifications.some((n: LocalNotification) => n.id === notification.id || n.message === notification.message)) return;
    notifications.unshift(notification);
    saveLocalNotifications(notifications);
  }
  function sendPushNotification({ title, message }: { title: string; message: string }) {
    // Use favicon for push notification icon
    if (window.Notification && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon-96x96.png' });
    }
  }
  // --- End notification helpers ---

  // Helper: Send local and push notifications for goal progress
  function sendGoalProgressNotification(goal: Goal, percent: number) {
    const motivationalMessages = [
      'Great start! Keep going!',
      'Awesome! You are making progress!',
      'You are on track. Stay focused!',
      'Halfway there! Keep pushing!',
      'Amazing! Almost at your goal!',
      'Congratulations! You achieved your goal!'
    ];
    let message = '';
    if (percent === 100) {
      message = `You reached your goal "${goal.name}"! ${motivationalMessages[5]}`;
    } else {
      const idx = Math.min(Math.floor(percent / 20), motivationalMessages.length - 2);
      message = `You reached ${percent}% of your goal "${goal.name}". ${motivationalMessages[idx]}`;
    }
    // Local notification
    const notificationId = `goal-${goal.id}-${percent}`;
    const notification: LocalNotification = {
      id: notificationId,
      title: percent === 100 ? 'Goal Achieved!' : 'Goal Progress',
      message,
      category: goal.category,
      timestamp: Date.now(),
      read: false
    };
    sendLocalNotification(notification);
    sendPushNotification({ title: notification.title, message });
  }

  // Effect: Watch for goal progress milestones
  useEffect(() => {
    if (!goals.length) return;
    goals.forEach(goal => {
      if (!goal.target || goal.target === 0) return;
      const percent = Math.floor((goal.current / goal.target) * 100);
      // Only fire for 10%, 20%, ..., 100%
      for (let milestone = 10; milestone <= 100; milestone += 10) {
        if (percent >= milestone) {
          sendGoalProgressNotification(goal, milestone);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals]);

  // Register sw-enhancement.js if not already registered
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration('/sw-enhancement.js').then((reg) => {
        if (!reg) {
          navigator.serviceWorker.register('/sw-enhancement.js');
        }
      });
    }
  }, []);

  return (
    <div className="flex flex-col gap-4 pb-20">
      <GoalModal 
        showModal={showGoalModal} 
        onClose={() => setShowGoalModal(false)} 
        onSave={handleSaveGoal}
        initialCategory={selectedGoalCategory}
        goalToEdit={currentGoal}
      />
      
      {progressGoal && (
        <ProgressUpdateModal
          showModal={showProgressModal}
          onClose={() => setShowProgressModal(false)}
          onUpdate={(amount) => {
            if (progressGoal) {
              handleUpdateGoalProgress(progressGoal.id, amount);
            }
          }}
          currentAmount={progressGoal.current}
          targetAmount={progressGoal.target}
        />
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Financial Goals</h2>
          <button
            onClick={() => handleAddNewGoal()}
            className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full flex items-center justify-center w-10 h-10"
            aria-label="New Goal"
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <i className="fa-solid fa-bullseye text-4xl mb-2"></i>
            <p>No financial goals yet. Set your first goal!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div 
                key={goal.id} 
                className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-800 transform transition-all duration-300 hover:shadow-md relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center mr-3">
                      <i className={`${getCategoryIcon(goal.category)} text-purple-500 text-xl`}></i>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-white">{goal.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{goal.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-800 dark:text-white">{formatCurrency(goal.target)}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{calculateDaysRemaining(goal.deadline)} days left</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mb-2">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full" 
                    style={{ width: `${calculateProgress(goal.current, goal.target)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300">{formatCurrency(goal.current)}</span>
                  <span className="text-gray-600 dark:text-gray-300">{calculateProgress(goal.current, goal.target)}%</span>
                </div>
                
                {/* Action buttons in a single row */}
                <div className="mt-3 flex justify-center space-x-6 border-t pt-3 dark:border-gray-600">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditGoal(goal);
                    }}
                    className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center bg-transparent"
                    aria-label="Edit goal"
                    title="Edit goal"
                  >
                    <i className="fa-solid fa-pen-to-square mr-1.5"></i>
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProgressModal(goal);
                    }}
                    className="text-xs text-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center bg-transparent"
                  >
                    <i className="fa-solid fa-chart-line mr-1.5"></i>
                    Update Progress
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGoal(goal.id);
                    }}
                    className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center bg-transparent"
                    aria-label="Delete goal"
                    title="Delete goal"
                  >
                    <i className="fa-solid fa-trash-alt mr-1.5"></i>
                    Delete
                  </button>
                </div>
                
                {goal.note && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                    Note: {goal.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
        {/* Recent Reminders Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mt-2">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Reminders</h2>
          <button
            className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-full flex items-center justify-center w-9 h-9"
            aria-label="Add Reminder"
            onClick={() => setShowReminderModal(true)}
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
        {/* Placeholder for reminders list */}
        {reminders.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            <i className="fa-regular fa-bell text-2xl mb-2"></i>
            <p>No reminders yet. Add one for upcoming payments!</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {reminders.slice(0, 4).map((reminder) => (
              <li key={reminder.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fa-regular fa-bell text-purple-500 text-xl"></i>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-white text-sm">{reminder.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formatReminderDate(reminder.date, reminder.time)}</div>
                  </div>
                </div>
                <button
                  className="ml-2 text-red-500 hover:text-red-700 bg-transparent p-1 rounded"
                  title="Delete Reminder"
                  aria-label="Delete Reminder"
                  onClick={async () => {
                    if (!currentUser || !reminder.goalId) return;
                    try {
                      await deleteDoc(doc(db, `users/${currentUser.uid}/goals/${reminder.goalId}/reminders`, reminder.id));
                      showToast('Reminder deleted!', 'success');
                    } catch (err) {
                      console.error('Error deleting reminder:', err);
                      showToast('Failed to delete reminder', 'error');
                    }
                  }}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Goal Suggestions Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Goal Suggestions</h2>
        <div className="space-y-3">
          {[
            { name: 'Retirement Fund', icon: 'fa-solid fa-umbrella-beach', category: 'Savings', description: 'Start saving for your retirement' },
            { name: 'Education Fund', icon: 'fa-solid fa-graduation-cap', category: 'Education', description: 'Save for future education expenses' },
            { name: 'Home Down Payment', icon: 'fa-solid fa-home', category: 'Home', description: 'Save for a down payment on a home' },
            { name: 'Emergency Fund', icon: 'fa-solid fa-shield-alt', category: 'Savings', description: '3-6 months of expenses for emergencies' }
          ].map((suggestion, index) => (
            <div 
              key={index} 
              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:bg-purple-50 dark:hover:bg-purple-900"
              onClick={() => handleAddNewGoal(suggestion.category)}
            >
              <div className="w-10 h-10 rounded-full bg-transparent flex items-center justify-center mr-3">
                <i className={`${suggestion.icon} text-purple-500`}></i>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800 dark:text-white">{suggestion.name}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{suggestion.description}</p>
              </div>
              <div className="ml-auto">
                <i className="fa-solid fa-plus text-purple-500"></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      

      {/* Add Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-5 w-full max-w-xs">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <img src="/favicon-96x96.png" alt="Reminder" className="w-6 h-6 rounded" />
                Add Reminder
              </h3>
              <button
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-transparent"
                onClick={() => setShowReminderModal(false)}
                aria-label="Close"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleAddReminder} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                  value={reminderTitle}
                  onChange={e => setReminderTitle(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                    value={reminderDate}
                    onChange={e => setReminderDate(e.target.value)}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                    value={reminderTime}
                    onChange={e => setReminderTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repeat</label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                  value={reminderType}
                  onChange={e => setReminderType(e.target.value as 'once' | 'monthly')}
                >
                  <option value="once">One Time</option>
                  <option value="monthly">Every Month</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal</label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white"
                  value={reminderGoalId}
                  onChange={e => setReminderGoalId(e.target.value)}
                  required
                >
                  <option value="">Select Goal</option>
                  {goals.map(goal => (
                    <option key={goal.id} value={goal.id}>{goal.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
                  onClick={() => setShowReminderModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notification (top, modern UI, full width, visible text, app theme gradient, enhanced animation) */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-sm px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-white text-sm font-medium transition-all duration-300 animate-toast-slide-in-theme
          ${toast.type === 'success' ? 'bg-gradient-to-r from-purple-500 via-purple-400 to-green-500' : 'bg-gradient-to-r from-red-500 via-pink-500 to-orange-500'}
        `} role="alert">
          <span>
            {toast.type === 'success' ? (
              <i className="fa-solid fa-circle-check text-lg mr-1"></i>
            ) : (
              <i className="fa-solid fa-circle-exclamation text-lg mr-1"></i>
            )}
          </span>
          <span className="flex-1 whitespace-normal break-words">{toast.message}</span>
          <button
            className="ml-2 text-white/80 hover:text-white bg-transparent p-1 rounded-full focus:outline-none"
            onClick={() => setToast(null)}
            aria-label="Close notification"
            tabIndex={0}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
          <style>{`
            @keyframes toast-slide-in-theme {
              from { opacity: 0; transform: translateY(-30px) scale(0.98) translateX(-50%); }
              to { opacity: 1; transform: translateY(0) scale(1) translateX(-50%); }
            }
            .animate-toast-slide-in-theme {
              animation: toast-slide-in-theme 0.5s cubic-bezier(.4,0,.2,1);
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Goals;
