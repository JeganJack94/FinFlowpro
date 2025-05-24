import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { motion} from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, updateDoc, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import PWAPrompt from '../components/PWAPrompt';
import Notifications from './Notifications';
import type { Timestamp } from 'firebase/firestore';

// Helper function to format date and time
const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) return '';
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return dateTimeString;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateTimeString;
  }
};

// Memoized transaction component to prevent unnecessary re-renders
const TransactionItem = React.memo(({
  transaction,
  formatCurrency,
  getCategoryIcon,
  onDelete,
}: {
  transaction: {
    id: string;
    type: string;
    amount: number;
    category: string;
    date: string;
    lendName?: string;
    note?: string;
  };
  formatCurrency: (amount: number) => string;
  getCategoryIcon: (category: string, type: string) => string;
  onDelete?: (id: string) => Promise<void>;
}) => {
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 flex items-center justify-between transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
          transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900' :
          transaction.type === 'expense' ? 'bg-red-100 dark:bg-red-900' :
          transaction.type === 'investment' ? 'bg-blue-100 dark:bg-blue-900' :
          transaction.type === 'lend' ? 'bg-purple-100 dark:bg-purple-900' :
          'bg-yellow-100 dark:bg-yellow-900'
        }`}>
          <i className={`${getCategoryIcon(transaction.category, transaction.type)} ${
            transaction.type === 'income' ? 'text-green-500' :
            transaction.type === 'expense' ? 'text-red-500' :
            transaction.type === 'investment' ? 'text-blue-500' :
            transaction.type === 'lend' ? 'text-purple-500' :
            'text-yellow-500'
          }`}></i>
        </div>
        <div>
          <div className="font-medium text-gray-800 dark:text-white">
            {transaction.category}
            {transaction.lendName && (
              <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                • {transaction.lendName}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(transaction.date)}</div>
        </div>
      </div>
      <div className="flex items-center">
        <div className={`font-semibold mr-3 ${
          transaction.type === 'income' ? 'text-green-500' :
          transaction.type === 'expense' ? 'text-red-500' :
          transaction.type === 'investment' ? 'text-blue-500' :
          transaction.type === 'lend' ? 'text-purple-500' :
          'text-yellow-500'
        }`}>
          {transaction.type === 'income' || transaction.type === 'investment' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </div>
        {onDelete && (
          <button
            className="focus:outline-none p-0 bg-transparent shadow-none border-none"
            tabIndex={0}
            aria-label="Delete transaction"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(transaction.id);
            }}
          >
            <i className="fa-solid fa-trash-alt text-lg text-red-400 hover:text-red-500 focus:text-red-600 transition-colors duration-200"></i>
          </button>
        )}
      </div>
    </div>
  );
});

// BudgetLimit type definition
type BudgetLimit = {
  id: string;
  category: string;
  limit: number;
  spent: number;
  notificationThreshold: number;
  userId?: string;
  timestamp?: Timestamp | null;
};

// Memoized budget limit component
const BudgetLimitItem = React.memo(({ 
  budget, 
  index, 
  formatCurrency, 
  onDelete 
}: { 
  budget: BudgetLimit, 
  index: number, 
  formatCurrency: (amount: number) => string,
  onDelete: (id: string) => Promise<void>
}) => {
  return (
    <motion.div 
      key={index} 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.3 }}
      whileHover={{ scale: 1.02, boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)" }}
    >
      <div className="flex justify-between mb-1">
        <span className="font-medium text-gray-800 dark:text-white">{budget.category}</span>
        <div className="flex items-center">
          <span className="text-gray-600 dark:text-gray-300 mr-2">
            {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
          </span>
          <button 
            className="focus:outline-none p-0 bg-transparent shadow-none border-none"
            onClick={() => onDelete(budget.id)}
          >
            <i className="fa-solid fa-trash-alt text-sm text-red-500 dark:text-red-400 hover:text-red-600 focus:text-red-600 transition-colors duration-200"></i>
          </button>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
        <div 
          className={`h-2.5 rounded-full ${
            (budget.spent / budget.limit) > 0.9 ? 'bg-red-500' :
            (budget.spent / budget.limit) > 0.7 ? 'bg-purple-500' : 'bg-purple-500'
          }`} 
          style={{ width: `${Math.min((budget.spent / budget.limit) * 100, 100)}%` }}
        ></div>
      </div>
    </motion.div>
  );
});

const Home: React.FC = () => {
  const { 
    formatCurrency,
    getCategoryIcon,
  } = useFinance();
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Dark mode state with improved initialization to prevent flashing
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Get saved mode from localStorage, or use system preference
    const savedMode = localStorage.getItem('darkMode');
    return savedMode !== null 
      ? savedMode === 'true' 
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode changes and handle side effects when isDarkMode changes
  useEffect(() => {
    // Apply dark mode to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };
  
  // Transaction modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'investment' | 'liability' | 'lend'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [lendName, setLendName] = useState<string>('');
  const [date, setDate] = useState<string>(() => {
    const now = new Date();
    return `${now.toISOString().split('T')[0]}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [note, setNote] = useState<string>('');
  
  // Budget limit modal states
  const [showBudgetModal, setShowBudgetModal] = useState<boolean>(false);
  const [limitCategory, setLimitCategory] = useState<string>('');
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [notificationThreshold, setNotificationThreshold] = useState<number>(80);
  
  // Budget limits state
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>([]);
  
  // All transactions modal state
  const [showAllTransactionsModal, setShowAllTransactionsModal] = useState(false);
  
  // Notification modal state
  const [showNotifications, setShowNotifications] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<LocalNotification[]>(() => getLocalNotifications());
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Show toast notification
  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }

  // Category options for each transaction type - memoized to prevent re-creation on each render
  const categoryOptions = useMemo(() => ({
    income: [
      { id: 'salary', name: 'Salary', icon: 'fa-solid fa-money-bill-wave' },
      { id: 'freelance', name: 'Freelance', icon: 'fa-solid fa-laptop-code' },
      { id: 'investment', name: 'Investment', icon: 'fa-solid fa-chart-line' },
      { id: 'business', name: 'Business', icon: 'fa-solid fa-briefcase' }
    ],
    expense: [
      { id: 'rent', name: 'Rent', icon: 'fa-solid fa-house' },
      { id: 'transportation', name: 'Transportation', icon: 'fa-solid fa-car' },
      { id: 'food', name: 'Food', icon: 'fa-solid fa-utensils' },
      { id: 'shopping', name: 'Shopping', icon: 'fa-solid fa-shopping-bag' },
      { id: 'entertainment', name: 'Entertainment', icon: 'fa-solid fa-film' },
      { id: 'medical', name: 'Medical', icon: 'fa-solid fa-hospital' },
      { id: 'subscriptions', name: 'Subscriptions', icon: 'fa-solid fa-calendar-check' },
      { id: 'utilities', name: 'Utilities', icon: 'fa-solid fa-bolt' },
      { id: 'card-payment', name: 'Card Payment', icon: 'fa-solid fa-credit-card' },
      { id: 'groceries', name: 'Groceries', icon: 'fa-solid fa-shopping-cart' },
      { id: 'home-appliances', name: 'Home Appliances', icon: 'fa-solid fa-blender' },
      { id: 'vacation', name: 'Vacation', icon: 'fa-solid fa-plane' },
      { id: 'dining', name: 'Dining', icon: 'fa-solid fa-utensils' },
      { id: 'drinks', name: 'Drinks', icon: 'fa-solid fa-glass-martini' },
      { id: 'others', name: 'Others', icon: 'fa-solid fa-ellipsis-h' }
    ],
    investment: [
      { id: 'gold', name: 'Gold', icon: 'fa-solid fa-coins' },
      { id: 'mutual-fund', name: 'Mutual Fund', icon: 'fa-solid fa-chart-pie' },
      { id: 'stock', name: 'Stock', icon: 'fa-solid fa-chart-line' },
      { id: 'property', name: 'Property', icon: 'fa-solid fa-building' }
    ],
    liability: [
      { id: 'loan', name: 'Loan', icon: 'fa-solid fa-hand-holding-usd' },
      { id: 'car-loan', name: 'Car Loan', icon: 'fa-solid fa-car' },
      { id: 'credit-card', name: 'Credit Card', icon: 'fa-solid fa-credit-card' }
    ],
    lend: [
      { id: 'personal', name: 'Personal', icon: 'fa-solid fa-user' },
      { id: 'family', name: 'Family', icon: 'fa-solid fa-users' },
      { id: 'friend', name: 'Friend', icon: 'fa-solid fa-user-friends' },
      { id: 'colleague', name: 'Colleague', icon: 'fa-solid fa-user-tie' },
      { id: 'other', name: 'Other', icon: 'fa-solid fa-user-shield' }
    ]
  }), []);
  
  // User transactions state
  type Transaction = {
    id: string;
    type: 'income' | 'expense' | 'investment' | 'liability' | 'lend';
    amount: number;
    category: string;
    date: string;
    note?: string;
    lendName?: string;
    timestamp?: Timestamp | null;
    userId?: string;
  };

  type BudgetLimit = {
    id: string;
    category: string;
    limit: number;
    spent: number;
    notificationThreshold: number;
    userId?: string;
    timestamp?: Timestamp | null;
    lastNotificationDate?: string | null;
    notificationSent?: boolean;
  };



  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [totalInvestment, setTotalInvestment] = useState<number>(0);
  const [totalLiability, setTotalLiability] = useState<number>(0);
  const [totalLend, setTotalLend] = useState<number>(0);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  
  // Memoize recent transactions to prevent re-renders
  const recentTransactions = useMemo(() => 
    userTransactions.slice(0, 5).map((transaction) => (
      <TransactionItem 
        key={transaction.id}
        transaction={transaction}
        formatCurrency={formatCurrency}
        getCategoryIcon={getCategoryIcon}
        onDelete={async (id) => {
          if (currentUser) {
            try {
              await deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', id));
              showToast('Transaction deleted successfully!', 'success');
            } catch (error) {
              console.error('Error deleting transaction:', error);
              showToast('Error deleting transaction. Please try again.', 'error');
            }
          }
        }}
      />
    )), [userTransactions, formatCurrency, getCategoryIcon, currentUser]);
  
  // Fetch user transactions from Firestore
  useEffect(() => {
    if (!currentUser) return;

    // Set up real-time listener for transactions
    const transactionsRef = collection(db, 'users', currentUser.uid, 'transactions');
    const transactionsQuery = query(
      transactionsRef,
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const transactions: Transaction[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type ?? '',
          amount: typeof data.amount === 'number' ? data.amount : 0,
          category: data.category ?? '',
          date: data.date ?? '',
          note: data.note,
          lendName: data.lendName,
          timestamp: data.timestamp,
          userId: data.userId,
        };
      });

      setUserTransactions(transactions);

      // Calculate totals
      let income = 0;
      let expense = 0;
      let investment = 0;
      let liability = 0;
      let lend = 0;

      // For tracking expenses by category (for budget limits)
      const expensesByCategory: Record<string, number> = {};

      transactions.forEach(transaction => {
        const amount = transaction.amount || 0;

        if (transaction.type === 'income') {
          income += amount;
        } else if (transaction.type === 'expense') {
          expense += amount;
          // Track expenses by category for budget limits
          const category = transaction.category;
          if (category) {
            expensesByCategory[category] = (expensesByCategory[category] || 0) + amount;
          }
        } else if (transaction.type === 'investment') {
          investment += amount;
        } else if (transaction.type === 'liability') {
          liability += amount;
        } else if (transaction.type === 'lend') {
          lend += amount;
        }
      });

      setTotalIncome(income);
      setTotalExpense(expense);
      setTotalInvestment(investment);
      setTotalLiability(liability);
      setTotalLend(lend);
      setTotalBalance(income - expense - lend);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Function to update budget limits with current expense totals
  const updateBudgetLimitsWithExpenses = useCallback((limits: BudgetLimit[]) => {
    if (!currentUser || limits.length === 0) return;

    // Calculate expenses by category
    const expensesByCategory: Record<string, number> = {};
    userTransactions.forEach(transaction => {
      if (transaction.type === 'expense') {
        const category = transaction.category;
        if (category) {
          expensesByCategory[category] = (expensesByCategory[category] || 0) + transaction.amount;
        }
      }
    });

    // Update each budget limit with the corresponding expense total
    limits.forEach(async (budgetLimit) => {
      const category = budgetLimit.category;
      const spent = expensesByCategory[category] || 0;
      
      // Only update if the spent amount has changed
      if (budgetLimit.spent !== spent) {
        try {
          await updateDoc(doc(db, 'users', currentUser.uid, 'budgetLimits', budgetLimit.id), {
            spent
          });
        } catch (error) {
          console.error('Error updating budget limit:', error);
        }
      }
    });
  }, [currentUser, userTransactions]);

  // Fetch budget limits from Firestore
  useEffect(() => {
    if (!currentUser) return;

    // Set up real-time listener for budget limits
    const budgetLimitsRef = collection(db, 'users', currentUser.uid, 'budgetLimits');
    const budgetLimitsQuery = query(
      budgetLimitsRef,
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(budgetLimitsQuery, (snapshot) => {
      const limits: BudgetLimit[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          category: data.category ?? '',
          limit: typeof data.limit === 'number' ? data.limit : 0,
          spent: typeof data.spent === 'number' ? data.spent : 0,
          notificationThreshold: typeof data.notificationThreshold === 'number' ? data.notificationThreshold : 80,
          userId: data.userId,
          timestamp: data.timestamp
        };
      });
      setBudgetLimits(limits);
      
      // Update budget limits with current expense totals
      updateBudgetLimitsWithExpenses(limits);
    });

    return () => unsubscribe();
  }, [currentUser, userTransactions, updateBudgetLimitsWithExpenses]);
  
  // Notification type
  interface LocalNotification {
    id: string;
    title: string;
    message: string;
    category?: string;
    timestamp: number;
    read: boolean;
  }

  // Local notification helpers
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

  // Only send notifications if enabled
  function sendLocalNotification(notification: LocalNotification) {
    if (localStorage.getItem('notifications') !== 'true') return;
    const notifications = getLocalNotifications();
    if (notifications.some((n: LocalNotification) => n.id === notification.id || n.message === notification.message)) return;
    notifications.unshift(notification);
    saveLocalNotifications(notifications);
  }

  function sendPushNotification({ title, message }: { title: string; message: string }) {
    if (localStorage.getItem('notifications') !== 'true') return;
    if (window.Notification && Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon-96x96.png' });
    }
  }

  // Listen for local notification changes (for modal)
  useEffect(() => {
    function handleStorage() {
      setLocalNotifications(getLocalNotifications());
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Show notification modal when bell icon is clicked
  const openNotifications = () => setShowNotifications(true);
  const closeNotifications = () => setShowNotifications(false);

  // Budget limit notification effect
  useEffect(() => {
    if (localStorage.getItem('notifications') !== 'true') return;
    budgetLimits.forEach((limit) => {
      if (limit.limit > 0 && limit.spent / limit.limit >= limit.notificationThreshold / 100) {
        const notificationId = `budget-${limit.id}`;
        const message = `You have reached ${limit.notificationThreshold}% of your budget for ${limit.category}.`;
        sendLocalNotification({
          id: notificationId,
          title: 'Budget Limit Alert',
          message,
          category: limit.category,
          timestamp: Date.now(),
          read: false,
        });
        sendPushNotification({ title: 'Budget Limit Alert', message });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetLimits]);

  // This state and effect prevents the flash/blinking during initial render
  const [isMounted, setIsMounted] = useState(false);
  
  // Run this effect once after the component mounts and initial rendering is complete
  useEffect(() => {
    // Set a minimal delay to ensure DOM is fully rendered before showing content
    // This prevents the flash of unstyled content
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 50);
    
    // Add a class to temporarily block transitions during initial render
    document.documentElement.classList.add('no-transitions');
    
    // Remove the transition blocking class after a short delay
    setTimeout(() => {
      document.documentElement.classList.remove('no-transitions');
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      className={`flex flex-col gap-4 pb-20 max-w-md mx-auto w-full overscroll-contain touch-manipulation bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 ${!isMounted ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}`}
    >
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 p-4 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80 shadow-[0_2px_10px_-2px_rgba(139,92,246,0.3)] dark:shadow-[0_2px_10px_-2px_rgba(139,92,246,0.2)]">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <i className="fa-solid fa-wallet text-purple-600 text-xl mr-2"></i>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">FinFlow</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Bell Icon for Notifications */}
            <button
              className="relative focus:outline-none bg-transparent hover:bg-transparent active:bg-transparent shadow-none border-none"
              aria-label="Show notifications"
              onClick={openNotifications}
            >
              <i className="fa-solid fa-bell text-xl text-purple-500 hover:text-purple-700 transition-colors"></i>
              {localNotifications.some((n: LocalNotification) => !n.read) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
              )}
            </button>
            {/* Dark/Light Mode Toggle */}
            <div className="relative">
              <motion.button
                className={`w-14 h-7 rounded-full flex items-center transition-colors duration-300 focus:outline-none shadow-md ${
                  isDarkMode ? 'bg-gray-700 justify-end' : 'bg-purple-400 justify-start'
                }`}
                onClick={toggleDarkMode}
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                <motion.div 
                  className={`w-5 h-5 rounded-full mx-1 flex items-center justify-center ${
                    isDarkMode ? 'bg-purple-500 text-white' : 'bg-white text-yellow-500'
                  }`}
                  layout
                  transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                >
                  {isDarkMode ? (
                    <i className="fa-solid fa-moon text-xs"></i>
                  ) : (
                    <i className="fa-solid fa-sun text-xs"></i>
                  )}
                </motion.div>
              </motion.button>
            </div>
            {/* User Avatar */}
            {currentUser && (
              <div 
                className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center cursor-pointer"
                onClick={() => navigate('/profile')}
              >
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white text-sm font-medium">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 
                     currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Add padding to account for fixed navbar */}
      <div className="pt-16">
        {/* PWA Install Prompt */}
        <PWAPrompt className="mx-4 mt-2" />
      </div>
      
      <div className="flex flex-col gap-4">
        <motion.div 
          className="relative overflow-hidden bg-gradient-to-br from-purple-100 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-5 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          style={{ willChange: 'transform' }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/20 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-100 dark:bg-purple-900/20 rounded-full -ml-12 -mb-12 opacity-50"></div>
          <div className="relative">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Balance</div>
            <motion.div 
              className="text-3xl font-bold text-gray-800 dark:text-white mb-3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {formatCurrency(totalBalance)}
            </motion.div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <i className="fa-solid fa-arrow-down text-green-500 mr-1"></i>
                <span className="text-xs text-gray-500">Income</span>
                <span className="text-xs font-semibold text-green-500 ml-1">+{formatCurrency(totalIncome)}</span>
              </div>
              <div className="flex items-center">
                <i className="fa-solid fa-arrow-up text-red-500 mr-1"></i>
                <span className="text-xs text-gray-500">Expenses</span>
                <span className="text-xs font-semibold text-red-500 ml-1">-{formatCurrency(totalExpense)}</span>
              </div>
            </div>
          </div>
        </motion.div>
        
        <div className="flex space-x-3 mb-4 overflow-x-auto py-2 scrollbar-hide">
          <motion.div 
            className="flex-shrink-0 w-32 h-24 bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-md p-3 flex flex-col justify-between"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <i className="fa-solid fa-money-bill-wave text-white text-xl"></i>
            <div>
              <div className="text-xs text-green-100">Income</div>
              <div className="text-white font-semibold">{formatCurrency(totalIncome)}</div>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex-shrink-0 w-32 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-md p-3 flex flex-col justify-between"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <i className="fa-solid fa-credit-card text-white text-xl"></i>
            <div>
              <div className="text-xs text-red-100">Expense</div>
              <div className="text-white font-semibold">{formatCurrency(totalExpense)}</div>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex-shrink-0 w-32 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-md p-3 flex flex-col justify-between"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <i className="fa-solid fa-chart-line text-white text-xl"></i>
            <div>
              <div className="text-xs text-blue-100">Investment</div>
              <div className="text-white font-semibold">{formatCurrency(totalInvestment)}</div>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex-shrink-0 w-32 h-24 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl shadow-md p-3 flex flex-col justify-between"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <i className="fa-solid fa-hand-holding-usd text-white text-xl"></i>
            <div>
              <div className="text-xs text-yellow-100">Liability</div>
              <div className="text-white font-semibold">{formatCurrency(totalLiability)}</div>
            </div>
          </motion.div>

          <motion.div 
            className="flex-shrink-0 w-32 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-md p-3 flex flex-col justify-between"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <i className="fa-solid fa-handshake text-white text-xl"></i>
            <div>
              <div className="text-xs text-purple-100">Lend</div>
              <div className="text-white font-semibold">{formatCurrency(totalLend)}</div>
            </div>
          </motion.div>
        </div>
        <div className="mb-4">
          <div className="flex flex-row items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mr-2">Recent Transactions</h2>
            <button
              className="ml-auto px-3 py-1 text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              onClick={() => setShowAllTransactionsModal(true)}
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {userTransactions.length === 0 ? (
              <div className="empty-state">
                <i className="fa-solid fa-receipt"></i>
                <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">No transactions yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Click the + button to add your first transaction
                </p>
                <button 
                  className="py-2 px-4 bg-purple-500 text-white rounded-lg"
                  onClick={() => setShowAddModal(true)}
                >
                  Add Transaction
                </button>
              </div>
            ) : (
              /* Use the memoized value directly */
              recentTransactions
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="flex flex-row items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mr-2">Budget Limits</h2>
            <motion.button 
              className="w-7 h-7 bg-purple-500 hover:bg-purple-600 flex items-center justify-center text-white rounded-full shadow-md ml-2"
              onClick={() => setShowBudgetModal(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{ position: 'static' }}
            >
              <i className="fa-solid fa-plus"></i>
            </motion.button>
          </div>
          <div className="space-y-4">
            {budgetLimits.map((budget, index) => (
              <BudgetLimitItem 
                key={index} 
                budget={budget} 
                index={index} 
                formatCurrency={formatCurrency}
                onDelete={async (id) => {
                  if (currentUser) {
                    try {
                      // Delete budget limit from Firestore
                      await deleteDoc(doc(db, 'users', currentUser.uid, 'budgetLimits', id));
                      showToast('Budget limit deleted successfully!', 'success');
                    } catch (error) {
                      console.error('Error deleting budget limit:', error);
                      showToast('Error deleting budget limit. Please try again.', 'error');
                    }
                  }
                }}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* FAB for adding transactions */}
      <motion.button
        className="fixed bottom-20 right-6 w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center shadow-xl z-50 fab"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowAddModal(true)}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <i className="fa-solid fa-plus text-white text-2xl"></i>
      </motion.button>
      
      {/* Transaction Modal */}
      {showAddModal && (
        <>
          {/* Hide FAB when modal is open by adding a hidden class */}
          <style>{`.fab { display: none !important; }`}</style>
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
            <motion.div 
              className="bg-white dark:bg-gray-900 rounded-xl w-11/12 max-w-md p-5 shadow-xl text-gray-900 dark:text-gray-100 max-h-[80vh] flex flex-col"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{ willChange: 'transform' }}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Add Transaction</h3>
                <button
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-full p-1 transition-colors duration-200"
                  onClick={() => setShowAddModal(false)}
                  aria-label="Close"
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="mb-4">
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex-col gap-2">
                  <div className="flex w-full gap-2">
                    {['expense', 'income'].map((type) => (
                      <button
                        key={type}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors duration-200
                          ${transactionType === type
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}
                        `}
                        onClick={() => setTransactionType(type as 'expense' | 'income' | 'investment' | 'liability' | 'lend')}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="flex w-full gap-2">
                    {['investment', 'liability'].map((type) => (
                      <button
                        key={type}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors duration-200
                          ${transactionType === type
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}
                        `}
                        onClick={() => setTransactionType(type as 'expense' | 'income' | 'investment' | 'liability' | 'lend')}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div className="flex w-full gap-2">
                    <button
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors duration-200
                        ${transactionType === 'lend'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}
                      `}
                      onClick={() => setTransactionType('lend')}
                    >
                      Lend
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-4 overflow-y-auto flex-1">
                {/* Amount input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">₹</span>
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-7 py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Category selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  {/* Responsive grid: 4 columns on mobile, 4 on larger screens for consistent alignment */}
                  <div className="grid grid-cols-4 gap-2">
                    {categoryOptions[transactionType].map((cat) => (
                      <div
                        key={cat.id}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-[1.05] ${
                          category === cat.name
                            ? 'bg-purple-100 dark:bg-purple-700 text-purple-600 dark:text-purple-200'
                            : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-200'
                        }`}
                        onClick={() => setCategory(cat.name)}
                      >
                        <i className={`${cat.icon} text-xl mb-1`}></i>
                        <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                          {cat.name}
                        </span>
                      </div>
                    ))}
                    {/* If the number of categories is not a multiple of 4, add empty divs for alignment */}
                    {Array.from({ length: (4 - (categoryOptions[transactionType].length % 4)) % 4 }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="invisible" />
                    ))}
                  </div>
                </div>
                
                {/* Lend Name input - only show for lend transaction type */}
                {transactionType === 'lend' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lend To</label>
                    <input
                      type="text"
                      className="block w-full py-3 px-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      placeholder="Name of borrower"
                      value={lendName}
                      onChange={(e) => setLendName(e.target.value)}
                    />
                  </div>
                )}
                
                {/* Date and Time input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date & Time</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      className="block w-full py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      value={date.split('T')[0]}
                      onChange={(e) => {
                        const currentTime = date.split('T')[1] || '00:00';
                        setDate(`${e.target.value}T${currentTime}`);
                      }}
                    />
                    <input
                      type="time"
                      className="block w-full py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      value={date.split('T')[1] || '00:00'}
                      onChange={(e) => {
                        const currentDate = date.split('T')[0];
                        setDate(`${currentDate}T${e.target.value}`);
                      }}
                    />
                  </div>
                </div>
                
                {/* Note input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (Optional)</label>
                  <textarea
                    className="block w-full py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    rows={2}
                    placeholder="Add a note..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  ></textarea>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition duration-300"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition duration-300"
                  onClick={handleAddTransaction}
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
      
      {/* Budget Limit Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl w-11/12 max-w-md p-5 shadow-xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ willChange: 'transform' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Add Budget Limit</h3>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setShowBudgetModal(false)}
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {categoryOptions.expense.map((cat) => (
                  <div
                    key={cat.id}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-[1.05] ${
                      limitCategory === cat.name
                        ? 'bg-purple-100 dark:bg-purple-900 text-purple-500'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                    onClick={() => setLimitCategory(cat.name)}
                  >
                    <i className={`fa-solid ${cat.icon} text-xl mb-1`}></i>
                    <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                      {cat.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Limit</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400">₹</span>
                </div>
                <input
                  type="text"
                  className="block w-full pl-7 py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                  value={limitAmount}
                  onChange={(e) => setLimitAmount(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notification Threshold</label>
              <div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  value={notificationThreshold}
                  onChange={(e) => setNotificationThreshold(Number(e.target.value))}
                />
                <div className="flex justify-between mt-1">
                  <span></span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{notificationThreshold}%</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition duration-300"
                onClick={() => setShowBudgetModal(false)}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition duration-300"
                onClick={handleAddBudgetLimit}
              >
                Save Limit
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* All Transactions Modal */}          {showAllTransactionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl w-11/12 max-w-md p-5 shadow-xl text-gray-900 dark:text-gray-100 max-h-[80vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ willChange: 'transform' }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">All Transactions</h3>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-full p-1 transition-colors duration-200"
                onClick={() => setShowAllTransactionsModal(false)}
                aria-label="Close"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="space-y-3">
              {userTransactions.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400">No transactions found.</div>
              ) : (
                userTransactions.map((transaction) => (
                  <TransactionItem 
                    key={transaction.id}
                    transaction={transaction}
                    formatCurrency={formatCurrency}
                    getCategoryIcon={getCategoryIcon}
                    onDelete={async (id) => {
                      if (currentUser) {
                        try {
                          await deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', id));
                          showToast('Transaction deleted successfully!', 'success');
                        } catch (error) {
                          console.error('Error deleting transaction:', error);
                          showToast('Error deleting transaction. Please try again.', 'error');
                        }
                      }
                    }}
                  />
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Notifications Modal (internal notifications) */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="w-full max-w-md mx-auto">
            <Notifications onClose={closeNotifications} />
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
  
  // Handle adding transaction to Firestore
  async function handleAddTransaction() {
    if (!amount || !category) {
      // You could add validation feedback here
      return;
    }
    
    // For lend transactions, require a name
    if (transactionType === 'lend' && !lendName) {
      alert('Please enter the borrower\'s name for lend transactions');
      return;
    }
    
    try {
      // Create transaction object with date and time
      const transaction: {
        type: typeof transactionType;
        amount: number;
        category: string;
        date: string;
        note?: string;
        lendName?: string;
        timestamp: ReturnType<typeof serverTimestamp>;
        userId?: string;
      } = {
        type: transactionType,
        amount: parseFloat(amount),
        category,
        date,
        timestamp: serverTimestamp(),
        userId: currentUser?.uid
      };
      
      // Only add note if it's not empty
      if (note && note.trim()) {
        transaction.note = note;
      }
      
      // Only add lendName for lend transactions
      if (transactionType === 'lend' && lendName) {
        transaction.lendName = lendName;
      }
      
      // Add to Firestore
      if (currentUser) {
        await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), transaction);
        
        // If this is an expense transaction, update any budget limits for this category
        if (transaction.type === 'expense') {
          // Find budget limits for this category
          const budgetLimitsRef = collection(db, 'users', currentUser.uid, 'budgetLimits');
          const q = query(
            budgetLimitsRef,
            where('category', '==', category)
          );
          
          const snapshot = await getDocs(q);
          
          snapshot.forEach(async (doc) => {
            const budgetLimit = doc.data();
            // Update the spent amount
            const newSpent = (budgetLimit.spent || 0) + parseFloat(amount);
            await updateDoc(doc.ref, { spent: newSpent });
          });
        }
        
        // Reset form and close modal
        setAmount('');
        setCategory('');
        setLendName('');
        const now = new Date();
        setDate(`${now.toISOString().split('T')[0]}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        setNote('');
        setShowAddModal(false);
        showToast('Transaction added successfully!', 'success');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      showToast('Error adding transaction. Please try again.', 'error');
    }
  }
  
  // Handle adding budget limit
  async function handleAddBudgetLimit() {
    if (!limitCategory || !limitAmount) {
      // Add validation feedback here
      alert('Please select a category and enter a limit amount');
      return;
    }
    
    try {
      const limitValue = parseFloat(limitAmount);
      
      if (isNaN(limitValue) || limitValue <= 0) {
        alert('Please enter a valid amount');
        return;
      }
      
      // Create budget limit object
      const budgetLimit = {
        category: limitCategory,
        limit: limitValue,
        spent: 0,
        notificationThreshold,
        userId: currentUser?.uid,
        timestamp: serverTimestamp()
      };
      
      // Add to Firestore
      if (currentUser) {
        await addDoc(collection(db, 'users', currentUser.uid, 'budgetLimits'), budgetLimit);
        setLimitCategory('');
        setLimitAmount('');
        setNotificationThreshold(80);
        setShowBudgetModal(false);
        showToast('Budget limit added successfully!', 'success');
      }
    } catch (error) {
      console.error('Error adding budget limit:', error);
      showToast('Error adding budget limit. Please try again.', 'error');
    }
  }
};

export default Home;
