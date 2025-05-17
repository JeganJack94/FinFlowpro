// Optimized Dashboard with dynamic imports and performance enhancements
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { StatusBar, BottomNavigation } from '../components/DashboardNavigation';
import TabContent from '../components/TabContent';

// Lazy load the transaction modal to reduce initial bundle size
const TransactionModal = lazy(() => import('../components/TransactionModal'));

// Performance measurement
const measureRender = (componentName: string) => {
  if (typeof performance !== 'undefined' && performance.mark) {
    const startMark = `${componentName}-render-start`;
    const endMark = `${componentName}-render-end`;
    
    performance.mark(startMark);
    
    return () => {
      performance.mark(endMark);
      performance.measure(`${componentName}-render-time`, startMark, endMark);
    };
  }
  return () => {};
};

const App: React.FC = () => {
  // Mark the start of the component rendering for performance tracking
  const endMeasure = measureRender('Dashboard');
  
  // State management
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>('home');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);
  const [newLimitCategory, setNewLimitCategory] = useState<string>('');
  const [newLimitAmount, setNewLimitAmount] = useState<string>('');
  const [notificationThreshold, setNotificationThreshold] = useState<string>('80');
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [transactionType, setTransactionType] = useState<string>('expense');
  const [goalCategory, setGoalCategory] = useState<string>('');
  const [goalName, setGoalName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [goalNote, setGoalNote] = useState<string>('');
  const [transactionSubType, setTransactionSubType] = useState<string>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');
  const [timeDisplay, setTimeDisplay] = useState<string>('');
  const [chartView, setChartView] = useState<string>('monthly');

  // Update time display at component mount and every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTimeDisplay(`${hours}:${minutes}`);
    };
    
    // Initial call
    updateTime();
    
    // Set up interval with proper cleanup
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // End performance measurement on component mount
  useEffect(() => {
    endMeasure();
  }, []);

  // Sample transaction data
  const transactions = [
    { id: 1, type: 'income', category: 'Salary', amount: 350000, date: '2025-05-15', note: 'Monthly salary' },
    { id: 2, type: 'expense', category: 'Rent', amount: 120000, date: '2025-05-01', note: 'Monthly rent' },
    { id: 3, type: 'expense', category: 'Groceries', amount: 8550, date: '2025-05-14', note: 'Weekly groceries' },
    { id: 4, type: 'expense', category: 'Dining', amount: 4275, date: '2025-05-13', note: 'Dinner with friends' },
    { id: 5, type: 'investment', category: 'Stocks', amount: 50000, date: '2025-05-10', note: 'HDFC shares' },
    { id: 6, type: 'expense', category: 'Transportation', amount: 3000, date: '2025-05-12', note: 'Uber rides' },
    { id: 7, type: 'liability', category: 'Credit Card', amount: 25000, date: '2025-05-08', note: 'HDFC Credit Card' }
  ];

  // Categories with icons
  const categories = {
    income: [
      { id: 'salary', name: 'Salary', icon: 'fa-solid fa-money-bill-wave' },
      { id: 'freelance', name: 'Freelance', icon: 'fa-solid fa-laptop-code' },
      { id: 'investments', name: 'Investments', icon: 'fa-solid fa-chart-line' },
      { id: 'gifts', name: 'Gifts', icon: 'fa-solid fa-gift' }
    ],
    expense: [
      { id: 'food', name: 'Food', icon: 'fa-solid fa-utensils' },
      { id: 'rent', name: 'Rent', icon: 'fa-solid fa-home' },
      { id: 'transport', name: 'Transport', icon: 'fa-solid fa-car' },
      { id: 'utilities', name: 'Utilities', icon: 'fa-solid fa-bolt' },
      { id: 'shopping', name: 'Shopping', icon: 'fa-solid fa-shopping-bag' },
      { id: 'medical', name: 'Medical', icon: 'fa-solid fa-hospital' },
      { id: 'entertainment', name: 'Entertainment', icon: 'fa-solid fa-film' }
    ],
    investment: [
      { id: 'stocks', name: 'Stocks', icon: 'fa-solid fa-chart-line' },
      { id: 'mutualfunds', name: 'Mutual Funds', icon: 'fa-solid fa-chart-pie' },
      { id: 'gold', name: 'Gold', icon: 'fa-solid fa-coins' },
      { id: 'realestate', name: 'Real Estate', icon: 'fa-solid fa-building' }
    ],
    liability: [
      { id: 'creditcard', name: 'Credit Card', icon: 'fa-solid fa-credit-card' },
      { id: 'loan', name: 'Loan', icon: 'fa-solid fa-hand-holding-usd' },
      { id: 'mortgage', name: 'Mortgage', icon: 'fa-solid fa-house-damage' }
    ]
  };

  // Financial goals
  const goals = [
    { id: 1, name: 'Emergency Fund', target: 1000000, current: 500000, deadline: '2025-12-31' },
    { id: 2, name: 'Vacation', target: 300000, current: 120000, deadline: '2025-08-15' },
    { id: 3, name: 'New Laptop', target: 150000, current: 80000, deadline: '2025-07-01' }
  ];

  // Budget limits
  const budgetLimits = [
    { category: 'Food', limit: 50000, spent: 35000 },
    { category: 'Shopping', limit: 30000, spent: 28000 },
    { category: 'Entertainment', limit: 20000, spent: 12000 }
  ];

  // Transaction handlers
  const handleAddTransaction = () => {
    // Logic to add transaction would go here
    setShowAddModal(false);
    setAmount('');
    setCategory('');
    setNote('');
  };

  const handleAddLimit = () => {
    // Validate inputs
    if (!newLimitCategory || !newLimitAmount) {
      return;
    }

    // Add new limit logic would go here
    // const newLimit = {
    //   category: newLimitCategory,
    //   limit: parseFloat(newLimitAmount),
    //   spent: 0,
    //   notificationThreshold: parseInt(notificationThreshold)
    // };

    // Reset form
    setShowLimitModal(false);
    setNewLimitCategory('');
    setNewLimitAmount('');
    setNotificationThreshold('80');
  };

  const handleAddGoal = () => {
    // Validate inputs
    if (!goalName || !targetAmount || !targetDate || !goalCategory) {
      return;
    }
    
    // Add new goal logic would go here
    // const newGoal = {
    //   id: goals.length + 1,
    //   name: goalName,
    //   target: parseFloat(targetAmount),
    //   current: parseFloat(currentAmount) || 0,
    //   deadline: targetDate,
    //   category: goalCategory,
    //   note: goalNote
    // };
    
    // Reset form
    setShowGoalModal(false);
    setGoalCategory('');
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setGoalNote('');
  };

  // Helper functions
  const getCategoryIcon = (categoryName: string, type: string) => {
    const categoryList = categories[type as keyof typeof categories] || categories.expense;
    const found = categoryList.find(c => c.name === categoryName);
    return found ? found.icon : 'fa-solid fa-question';
  };

  // Format currency to INR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className={`min-h-screen pb-16 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Status Bar - Static content that doesn't change often */}
      <StatusBar timeDisplay={timeDisplay} />
      
      {/* Main Content - This is where most of the dynamic content lives */}
      <div className="pt-14 px-4 pb-20">
        <TabContent
          selectedTab={selectedTab}
          darkMode={darkMode}
          transactions={transactions}
          goals={goals}
          budgetLimits={budgetLimits}
          formatCurrency={formatCurrency}
          getCategoryIcon={getCategoryIcon}
          categories={categories}
          showLimitModal={showLimitModal}
          setShowLimitModal={setShowLimitModal}
          showGoalModal={showGoalModal}
          setShowGoalModal={setShowGoalModal}
          handleAddLimit={handleAddLimit}
          handleAddGoal={handleAddGoal}
          newLimitCategory={newLimitCategory}
          setNewLimitCategory={setNewLimitCategory}
          newLimitAmount={newLimitAmount}
          setNewLimitAmount={setNewLimitAmount}
          notificationThreshold={notificationThreshold}
          setNotificationThreshold={setNotificationThreshold}
          goalCategory={goalCategory}
          setGoalCategory={setGoalCategory}
          goalName={goalName}
          setGoalName={setGoalName}
          targetAmount={targetAmount}
          setTargetAmount={setTargetAmount}
          currentAmount={currentAmount}
          setCurrentAmount={setCurrentAmount}
          targetDate={targetDate}
          setTargetDate={setTargetDate}
          goalNote={goalNote}
          setGoalNote={setGoalNote}
          chartView={chartView}
          setChartView={setChartView}
          setDarkMode={setDarkMode}
        />
      </div>
      
      {/* Add Transaction Button - Fixed position */}
      <button
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-purple-500 text-white shadow-lg flex items-center justify-center cursor-pointer !rounded-button transform transition-all duration-300 hover:scale-[1.1] hover:bg-purple-600 active:scale-[0.95] will-change-transform"
        onClick={() => setShowAddModal(true)}
        aria-label="Add transaction"
      >
        <i className="fa-solid fa-plus text-xl"></i>
      </button>
      
      {/* Bottom Navigation - Static component that changes state */}
      <BottomNavigation 
        selectedTab={selectedTab} 
        setSelectedTab={setSelectedTab} 
      />
      
      {/* Transaction Modal - Lazy loaded */}
      <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl w-11/12 max-w-md shadow-xl animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>}>
        <TransactionModal
          showAddModal={showAddModal}
          setShowAddModal={setShowAddModal}
          transactionType={transactionType}
          setTransactionType={setTransactionType}
          transactionSubType={transactionSubType}
          setTransactionSubType={setTransactionSubType}
          amount={amount}
          setAmount={setAmount}
          category={category}
          setCategory={setCategory}
          date={date}
          setDate={setDate}
          note={note}
          setNote={setNote}
          handleAddTransaction={handleAddTransaction}
          categories={categories}
        />
      </Suspense>
      
      {/* Animation CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
          will-change: opacity, transform;
        }
      `}</style>
    </div>
  );
};

export default App;
