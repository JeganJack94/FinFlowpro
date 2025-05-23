import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '../contexts/FinanceContext';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import PWAPrompt from '../components/PWAPrompt';
import { useNotification } from '../components/NotificationProvider';
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
  };
  formatCurrency: (amount: number) => string;
  getCategoryIcon: (category: string, type: string) => string;
  onDelete?: (id: string) => Promise<void>;
}) => {
  return (
    <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 flex items-center justify-between transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
          transaction.type === 'income' ? 'bg-purple-100 dark:bg-purple-900' :
          transaction.type === 'expense' ? 'bg-red-100 dark:bg-red-900' :
          transaction.type === 'investment' ? 'bg-blue-100 dark:bg-blue-900' :
          'bg-yellow-100 dark:bg-yellow-900'
        }`}>
          <i className={`${getCategoryIcon(transaction.category, transaction.type)} ${
            transaction.type === 'income' ? 'text-purple-500' :
            transaction.type === 'expense' ? 'text-red-500' :
            transaction.type === 'investment' ? 'text-blue-500' :
            'text-yellow-500'
          }`}></i>
        </div>
        <div>
          <div className="font-medium text-gray-800 dark:text-white">{transaction.category}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(transaction.date)}</div>
        </div>
      </div>
      <div className="flex items-center">
        <div className={`font-semibold mr-3 ${
          transaction.type === 'income' ? 'text-purple-500' :
          transaction.type === 'expense' ? 'text-red-500' :
          transaction.type === 'investment' ? 'text-blue-500' :
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
  lastNotificationDate?: string | null;
  notificationSent?: boolean;
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
  const { sendPushNotification } = useNotification();
  
  // Transaction modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'investment' | 'liability'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
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
  
  // Notifications state
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  
  // All transactions modal state
  const [showAllTransactionsModal, setShowAllTransactionsModal] = useState(false);
  
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
    ]
  }), []);
  
  // User transactions state
  type Transaction = {
    id: string;
    type: 'income' | 'expense' | 'investment' | 'liability';
    amount: number;
    category: string;
    date: string;
    note?: string;
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

  type UserNotification = {
    id: string;
    title: string;
    message: string;
    category: string;
    type: string;
    timestamp?: Timestamp | null;
    read: boolean;
    createdDate: string;
  };

  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [totalInvestment, setTotalInvestment] = useState<number>(0);
  const [totalLiability, setTotalLiability] = useState<number>(0);
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
            } catch (error) {
              console.error('Error deleting transaction:', error);
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
        }
      });

      setTotalIncome(income);
      setTotalExpense(expense);
      setTotalInvestment(investment);
      setTotalLiability(liability);
      setTotalBalance(income - expense);
    });

    return () => unsubscribe();
  }, [currentUser]);

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
        const notificationsEnabled = localStorage.getItem('notifications') === 'true';
        return {
          id: doc.id,
          category: data.category ?? '',
          limit: typeof data.limit === 'number' ? data.limit : 0,
          spent: typeof data.spent === 'number' ? data.spent : 0,
          notificationThreshold: typeof data.notificationThreshold === 'number' ? data.notificationThreshold : 80,
          userId: data.userId,
          timestamp: data.timestamp,
          lastNotificationDate: data.lastNotificationDate ?? null,
          notificationSent: notificationsEnabled ? (data.notificationSent || false) : true
        };
      });
      setBudgetLimits(limits);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch notifications from Firestore
  useEffect(() => {
    if (!currentUser) return;

    // Set up real-time listener for notifications
    const notificationsRef = collection(db, 'users', currentUser.uid, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const userNotifications: UserNotification[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title ?? '',
          message: data.message ?? '',
          category: data.category ?? '',
          type: data.type ?? '',
          timestamp: data.timestamp,
          read: !!data.read,
          createdDate: data.createdDate ?? ''
        };
      });
      setNotifications(userNotifications);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Separate effect for budget notification logic
  useEffect(() => {
    if (!currentUser || budgetLimits.length === 0) return;

    // Use function from outside the effect to prevent unnecessary recreations
    const checkAndSendNotifications = async () => {
      // Calculate expenses by category
      const expensesByCategory: Record<string, number> = {};
      userTransactions.forEach(transaction => {
        if (transaction.type === 'expense') {
          const category = transaction.category;
          if (category) {
            expensesByCategory[category] = (expensesByCategory[category] || 0) + (transaction.amount || 0);
          }
        }
      });

      for (const limit of budgetLimits) {
        const spent = expensesByCategory[limit.category] || 0;
        const notificationsEnabled = localStorage.getItem('notifications') === 'true';
        const percentSpentValue = (spent / limit.limit) * 100;
        const today = new Date().toISOString().split('T')[0];
        if (
          notificationsEnabled &&
          percentSpentValue >= limit.notificationThreshold &&
          (!limit.lastNotificationDate || limit.lastNotificationDate !== today)
        ) {
          const existingTodayNotification = notifications.find(notif =>
            notif.category === limit.category &&
            notif.type === 'budget-alert' &&
            notif.createdDate === today &&
            !notif.read
          );
          if (!existingTodayNotification && currentUser) {
            try {
              const newNotification = {
                title: 'Budget Alert',
                message: `You've used ${percentSpentValue.toFixed(0)}% of your ${limit.category} budget`,
                category: limit.category,
                type: 'budget-alert',
                timestamp: serverTimestamp(),
                read: false,
                createdDate: today
              };
              await addDoc(collection(db, 'users', currentUser.uid, 'notifications'), newNotification);
              const budgetRef = doc(db, 'users', currentUser.uid, 'budgetLimits', limit.id);
              await updateDoc(budgetRef, {
                lastNotificationDate: today
              });
              // Send browser push notification
              sendPushNotification('Budget Alert', `You've used ${percentSpentValue.toFixed(0)}% of your ${limit.category} budget`);
            } catch (error) {
              console.error('Error in notification/budget update process:', error);
            }
          }
        }
      }
    };

    checkAndSendNotifications();
  }, [budgetLimits, notifications, userTransactions, currentUser, sendPushNotification]);

  // Handle pull-to-refresh functionality for mobile devices
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Store the initial touch position for pull-to-refresh calculation
    const touchY = e.touches[0].clientY;
    const element = e.currentTarget;
    
    element.setAttribute('data-touch-start-y', touchY.toString());
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const element = e.currentTarget;
    const touchStartY = parseInt(element.getAttribute('data-touch-start-y') || '0');
    const touchY = e.touches[0].clientY;
    const scrollTop = element.scrollTop;
    
    // If we're at the top of the scroll and pulling down
    if (scrollTop <= 0 && touchY > touchStartY && touchY - touchStartY > 70) {
      e.preventDefault();
      element.classList.add('refreshing');
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const element = e.currentTarget;
    
    if (element.classList.contains('refreshing')) {
      element.classList.remove('refreshing');
      // Perform refresh action - for a PWA this would typically reload data from cache/network
      window.location.reload();
    }
  }, []);

  return (
    <div 
      className="flex flex-col gap-4 pb-20 max-w-md mx-auto w-full overscroll-contain touch-manipulation bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* PWA Install Prompt */}
      <PWAPrompt className="mx-4 mt-2" />
      
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <i className="fa-solid fa-wallet text-purple-600 text-xl mr-2"></i>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">FinFlow</h1>
              </div>
              <div className="flex items-center space-x-2">
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.i 
                    className="fa-solid fa-bell text-gray-600 dark:text-gray-400 text-lg cursor-pointer"
                    onClick={() => navigate('/notifications')}
                  ></motion.i>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </motion.div>
              </div>
            </div>
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
                <i className="fa-solid fa-arrow-down text-purple-500 mr-1"></i>
                <span className="text-xs text-gray-500">Income</span>
                <span className="text-xs font-semibold text-purple-500 ml-1">+{formatCurrency(totalIncome)}</span>
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
            className="flex-shrink-0 w-32 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-md p-3 flex flex-col justify-between"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <i className="fa-solid fa-money-bill-wave text-white text-xl"></i>
            <div>
              <div className="text-xs text-purple-100">Income</div>
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
                    } catch (error) {
                      console.error('Error deleting budget limit:', error);
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
                        onClick={() => setTransactionType(type as 'expense' | 'income' | 'investment' | 'liability')}
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
                        onClick={() => setTransactionType(type as 'expense' | 'income' | 'investment' | 'liability')}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
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
                        } catch (error) {
                          console.error('Error deleting transaction:', error);
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
    </div>
  );
  
  // Handle adding transaction to Firestore
  async function handleAddTransaction() {
    if (!amount || !category) {
      // You could add validation feedback here
      return;
    }
    
    try {
      // Create transaction object with date and time
      const transaction = {
        type: transactionType,
        amount: parseFloat(amount),
        category,
        date,
        note,
        timestamp: serverTimestamp(),
        userId: currentUser?.uid
      };
      
      // Add to Firestore
      if (currentUser) {
        await addDoc(collection(db, 'users', currentUser.uid, 'transactions'), transaction);
        
        // Reset form and close modal
        setAmount('');
        setCategory('');
        const now = new Date();
        setDate(`${now.toISOString().split('T')[0]}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        setNote('');
        setShowAddModal(false);
        
        // Send push notification for transaction addition
        sendPushNotification('Transaction Added', `A new ${transactionType} of ${formatCurrency(parseFloat(amount))} has been added.`);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
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
      
      // Create budget limit object with lastNotificationDate
      const budgetLimit = {
        category: limitCategory,
        limit: limitValue,
        spent: 0,
        notificationThreshold,
        userId: currentUser?.uid,
        timestamp: serverTimestamp(),
        lastNotificationDate: null // Track for daily notification control
      };
      
      // Add to Firestore
      if (currentUser) {
        await addDoc(collection(db, 'users', currentUser.uid, 'budgetLimits'), budgetLimit);
        setLimitCategory('');
        setLimitAmount('');
        setNotificationThreshold(80);
        setShowBudgetModal(false);
        
        // Send push notification for budget limit addition
        sendPushNotification('Budget Limit Added', `A new budget limit of ${formatCurrency(limitValue)} has been set for ${limitCategory}.`);
      }
    } catch (error) {
      console.error('Error adding budget limit:', error);
    }
  }
};

export default Home;
