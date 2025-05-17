import React, { useState, useEffect } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { doc, collection, addDoc, serverTimestamp, onSnapshot, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

const Home: React.FC = () => {
  const { 
    formatCurrency,
    getCategoryIcon,
  } = useFinance();
  
  const { currentUser } = useAuth();
  
  // Transaction modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'investment' | 'liability'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  
  // Budget limit modal states
  const [showBudgetModal, setShowBudgetModal] = useState<boolean>(false);
  const [limitCategory, setLimitCategory] = useState<string>('');
  const [limitAmount, setLimitAmount] = useState<string>('');
  const [notificationThreshold, setNotificationThreshold] = useState<number>(80);
  
  // Budget limits state
  const [budgetLimits, setBudgetLimits] = useState<any[]>([]);
  
  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  
  // Category options for each transaction type
  const categoryOptions = {
    income: [
      { id: 'salary', name: 'Salary', icon: 'fa-money-bill-wave' },
      { id: 'freelance', name: 'Freelance', icon: 'fa-laptop-code' },
      { id: 'investment', name: 'Investment', icon: 'fa-chart-line' },
      { id: 'business', name: 'Business', icon: 'fa-briefcase' }
    ],
    expense: [
      { id: 'rent', name: 'Rent', icon: 'fa-home' },
      { id: 'transportation', name: 'Transportation', icon: 'fa-car' },
      { id: 'food', name: 'Food', icon: 'fa-utensils' },
      { id: 'shopping', name: 'Shopping', icon: 'fa-shopping-bag' },
      { id: 'entertainment', name: 'Entertainment', icon: 'fa-film' },
      { id: 'medical', name: 'Medical', icon: 'fa-hospital' },
      { id: 'subscriptions', name: 'Subscriptions', icon: 'fa-calendar-check' },
      { id: 'utilities', name: 'Utilities', icon: 'fa-bolt' },
      { id: 'groceries', name: 'Groceries', icon: 'fa-shopping-cart' },
      { id: 'home-appliances', name: 'Home Appliances', icon: 'fa-blender' },
      { id: 'vacation', name: 'Vacation', icon: 'fa-plane' },
      { id: 'dining', name: 'Dining', icon: 'fa-utensils' },
      { id: 'drinks', name: 'Drinks', icon: 'fa-cocktail' },
      { id: 'others', name: 'Others', icon: 'fa-ellipsis-h' }
    ],
    investment: [
      { id: 'gold', name: 'Gold', icon: 'fa-coins' },
      { id: 'mutual-fund', name: 'Mutual Fund', icon: 'fa-chart-pie' },
      { id: 'stock', name: 'Stock', icon: 'fa-chart-line' },
      { id: 'property', name: 'Property', icon: 'fa-building' }
    ],
    liability: [
      { id: 'loan', name: 'Loan', icon: 'fa-hand-holding-usd' },
      { id: 'car-loan', name: 'Car Loan', icon: 'fa-car' },
      { id: 'credit-card', name: 'Credit Card', icon: 'fa-credit-card' }
    ]
  };
  
  // User transactions state
  type Transaction = {
    id: string;
    type: string;
    amount: number;
    category: string;
    date: string;
    note?: string;
    timestamp?: any;
    userId?: string;
  };
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpense, setTotalExpense] = useState<number>(0);
  const [totalInvestment, setTotalInvestment] = useState<number>(0);
  const [totalLiability, setTotalLiability] = useState<number>(0);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  
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

      // Update budget limits with actual spending
      if (budgetLimits.length > 0) {
        const updatedLimits = budgetLimits.map(limit => {
          const spent = expensesByCategory[limit.category] || 0;
          const percentSpent = (spent / limit.limit) * 100;
          
          // Check if we need to create a notification
          if (percentSpent >= limit.notificationThreshold && !limit.notificationSent) {
            // Check if we already have a notification for this budget limit from today
            const today = new Date().toDateString();
            const existingNotification = notifications.find(notif => 
              notif.category === limit.category && 
              notif.type === 'budget-alert' &&
              new Date(notif.timestamp?.toDate?.() || notif.timestamp).toDateString() === today
            );

            if (!existingNotification) {
              // Create a notification for exceeded threshold
              const newNotification = {
                id: `${limit.id}-${Date.now()}`,
                title: 'Budget Alert',
                message: `You've used ${percentSpent.toFixed(0)}% of your ${limit.category} budget`,
                category: limit.category,
                type: 'budget-alert',
                timestamp: serverTimestamp(),
                read: false
              };
              
              // Add notification to Firestore
              if (currentUser) {
                addDoc(collection(db, 'users', currentUser.uid, 'notifications'), newNotification)
                  .catch(error => console.error('Error adding notification:', error));
              }
              
              // Update local notifications array
              setNotifications(prev => [newNotification, ...prev]);
            }
            
            // Mark this notification as sent
            return { ...limit, spent, notificationSent: true };
          }
          
          return { ...limit, spent };
        });
        
        setBudgetLimits(updatedLimits);
      }
    });
    
    return () => unsubscribe();
  }, [currentUser, budgetLimits]);

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
      const limits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        notificationSent: false // Reset notification status on initial load
      }));
      
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
      const userNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(userNotifications);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Handle pull-to-refresh functionality for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    // Store the initial touch position for pull-to-refresh calculation
    const touchY = e.touches[0].clientY;
    const element = e.currentTarget;
    
    element.setAttribute('data-touch-start-y', touchY.toString());
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const element = e.currentTarget;
    const touchStartY = parseInt(element.getAttribute('data-touch-start-y') || '0');
    const touchY = e.touches[0].clientY;
    const scrollTop = element.scrollTop;
    
    // If we're at the top of the scroll and pulling down
    if (scrollTop <= 0 && touchY > touchStartY && touchY - touchStartY > 70) {
      e.preventDefault();
      element.classList.add('refreshing');
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const element = e.currentTarget;
    
    if (element.classList.contains('refreshing')) {
      element.classList.remove('refreshing');
      // Perform refresh action - for a PWA this would typically reload data from cache/network
      window.location.reload();
    }
  };

  return (
    <div 
      className="flex flex-col gap-4 pb-20 max-w-md mx-auto w-full overscroll-contain touch-manipulation"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      <div className="flex flex-col gap-4">
        <motion.div 
          className="relative overflow-hidden bg-gradient-to-br from-purple-100 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-5 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
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
                    onClick={() => setShowNotifications(!showNotifications)}
                  ></motion.i>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                  
                  {/* Notifications dropdown */}
                  {showNotifications && (
                    <motion.div 
                      className="absolute top-8 right-0 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-medium text-lg text-gray-800 dark:text-white">Notifications</h3>
                        <button 
                          className="text-sm text-purple-500 hover:text-purple-700 transition-colors"
                          onClick={async () => {
                            if (currentUser) {
                              // Mark all notifications as read
                              for (const notif of notifications) {
                                if (!notif.read) {
                                  try {
                                    // Update notification in Firestore
                                    await deleteDoc(doc(db, 'users', currentUser.uid, 'notifications', notif.id));
                                    await addDoc(collection(db, 'users', currentUser.uid, 'notifications'), {
                                      ...notif,
                                      read: true,
                                      timestamp: serverTimestamp()
                                    });
                                  } catch (error) {
                                    console.error('Error marking notification as read:', error);
                                  }
                                }
                              }
                            }
                          }}
                        >
                          Mark all as read
                        </button>
                      </div>
                      <div className="max-h-120 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                            <i className="fa-solid fa-bell-slash text-3xl mb-3"></i>
                            <p className="text-sm font-medium">No notifications</p>
                            <p className="text-xs mt-1">You're all caught up!</p>
                          </div>
                        ) : (
                          notifications.map(notification => (
                            <div 
                              key={notification.id} 
                              className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!notification.read ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}
                              onClick={async () => {
                                if (currentUser && !notification.read) {
                                  try {
                                    // Mark as read in Firestore
                                    await deleteDoc(doc(db, 'users', currentUser.uid, 'notifications', notification.id));
                                    await addDoc(collection(db, 'users', currentUser.uid, 'notifications'), {
                                      ...notification,
                                      read: true,
                                      timestamp: serverTimestamp()
                                    });
                                  } catch (error) {
                                    console.error('Error marking notification as read:', error);
                                  }
                                }
                              }}
                            >
                              <div className="flex items-start">
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3 flex-shrink-0">
                                  <i className="fa-solid fa-chart-pie text-purple-500"></i>
                                </div>
                                <div>
                                  <div className="font-medium text-sm text-gray-800 dark:text-white">{notification.title}</div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {typeof notification.timestamp === 'object' && notification.timestamp?.toDate 
                                      ? notification.timestamp.toDate().toLocaleString() 
                                      : new Date().toLocaleString()}
                                  </div>
                                </div>
                                {!notification.read && (
                                  <div className="ml-auto pl-2 flex items-center">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                  </div>
                                )}
                              </div>
                              {!notification.read && (
                                <div className="mt-2 text-right">
                                  <span className="text-xs text-purple-500">Tap to mark as read</span>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
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
          <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Recent Transactions</h2>
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
              userTransactions.slice(0, 5).map((transaction: {
                id: string;
                type: string;
                amount: number;
                category: string;
                date: string;
              }) => (
                <div key={transaction.id} className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 flex items-center justify-between transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
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
                      <div className="text-xs text-gray-500 dark:text-gray-400">{transaction.date}</div>
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
                    <button 
                      className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (currentUser) {
                          try {
                            // Delete transaction from Firestore
                            await deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', transaction.id));
                          } catch (error) {
                            console.error('Error deleting transaction:', error);
                          }
                        }
                      }}
                    >
                      <i className="fa-solid fa-trash-alt text-sm"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Budget Limits</h2>
            <motion.button 
              className="w-7 h-7 bg-purple-500 hover:bg-purple-600 flex items-center justify-center text-white rounded-full shadow-md"
              onClick={() => setShowBudgetModal(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <i className="fa-solid fa-plus"></i>
            </motion.button>
          </div>
          <div className="space-y-4">
            {budgetLimits.map((budget, index) => (
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
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      onClick={async () => {
                        if (currentUser) {
                          try {
                            // Delete budget limit from Firestore
                            await deleteDoc(doc(db, 'users', currentUser.uid, 'budgetLimits', budget.id));
                          } catch (error) {
                            console.error('Error deleting budget limit:', error);
                          }
                        }
                      }}
                    >
                      <i className="fa-solid fa-trash-alt text-sm"></i>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl w-11/12 max-w-md p-5 shadow-xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Add Transaction</h3>
              <button
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={() => setShowAddModal(false)}
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            
            <div className="mb-4">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {['expense', 'income', 'investment', 'liability'].map((type) => (
                  <button
                    key={type}
                    className={`flex-1 py-2 text-sm font-medium rounded-md ${
                      transactionType === type
                        ? 'bg-purple-500 text-white'
                        : 'text-gray-600 dark:text-gray-300'
                    }`}
                    onClick={() => setTransactionType(type as 'expense' | 'income' | 'investment' | 'liability')}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
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
                <div className="grid grid-cols-4 gap-2">
                  {/* Display categories based on transaction type */}
                  {categoryOptions[transactionType].map((cat) => (
                    <div
                      key={cat.id}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-[1.05] ${
                        category === cat.name
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-500'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                      onClick={() => setCategory(cat.name)}
                    >
                      <i className={`fa-solid ${cat.icon} text-xl mb-1`}></i>
                      <span className="text-xs whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                        {cat.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Date input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  className="block w-full py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
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
      )}
      
      {/* Budget Limit Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 modal-overlay">
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-xl w-11/12 max-w-md p-5 shadow-xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
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
    </div>
  );
  
  // Handle adding transaction to Firestore
  async function handleAddTransaction() {
    if (!amount || !category) {
      // You could add validation feedback here
      return;
    }
    
    try {
      // Create transaction object
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
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
        setShowAddModal(false);
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
        
        // Reset form and close modal
        setLimitCategory('');
        setLimitAmount('');
        setNotificationThreshold(80);
        setShowBudgetModal(false);
      }
    } catch (error) {
      console.error('Error adding budget limit:', error);
    }
  } 
} 

export default Home;
