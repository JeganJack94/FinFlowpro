import React, { lazy, Suspense } from 'react';

// Create loading placeholders with skeleton UI
const TabLoadingPlaceholder: React.FC = () => (
  <div className="flex flex-col gap-4 animate-pulse">
    <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
  </div>
);

// Lazy load each tab component
const HomeTab = lazy(() => import('./tabs/HomeTab'));
const AnalyticsTab = lazy(() => import('./tabs/AnalyticsTab'));
const GoalsTab = lazy(() => import('./tabs/GoalsTab'));
const ProfileTab = lazy(() => import('./tabs/ProfileTab'));

interface TabContentProps {
  selectedTab: string;
  darkMode: boolean;
  transactions: any[];
  goals: any[];
  budgetLimits: any[];
  formatCurrency: (amount: number) => string;
  getCategoryIcon: (categoryName: string, type: string) => string;
  categories: any;
  // Modal state and handlers
  showLimitModal: boolean;
  setShowLimitModal: (show: boolean) => void;
  showGoalModal: boolean;
  setShowGoalModal: (show: boolean) => void;
  handleAddLimit: () => void;
  handleAddGoal: () => void;
  // Form states
  newLimitCategory: string;
  setNewLimitCategory: (category: string) => void;
  newLimitAmount: string;
  setNewLimitAmount: (amount: string) => void;
  notificationThreshold: string;
  setNotificationThreshold: (threshold: string) => void;
  goalCategory: string;
  setGoalCategory: (category: string) => void;
  goalName: string;
  setGoalName: (name: string) => void;
  targetAmount: string;
  setTargetAmount: (amount: string) => void;
  currentAmount: string;
  setCurrentAmount: (amount: string) => void;
  targetDate: string;
  setTargetDate: (date: string) => void;
  goalNote: string;
  setGoalNote: (note: string) => void;
  chartView: string;
  setChartView: (view: string) => void;
  setDarkMode: (darkMode: boolean) => void;
}

const TabContent: React.FC<TabContentProps> = ({
  selectedTab,
  darkMode,
  transactions,
  goals,
  budgetLimits,
  formatCurrency,
  getCategoryIcon,
  categories,
  showLimitModal,
  setShowLimitModal,
  showGoalModal,
  setShowGoalModal,
  handleAddLimit,
  handleAddGoal,
  newLimitCategory,
  setNewLimitCategory,
  newLimitAmount,
  setNewLimitAmount,
  notificationThreshold,
  setNotificationThreshold,
  goalCategory,
  setGoalCategory,
  goalName,
  setGoalName,
  targetAmount,
  setTargetAmount,
  currentAmount,
  setCurrentAmount,
  targetDate,
  setTargetDate,
  goalNote,
  setGoalNote,
  chartView,
  setChartView,
  setDarkMode
}) => {
  // Use a performance marker to track rendering time
  React.useEffect(() => {
    if (typeof performance !== 'undefined' && performance.mark) {
      const markName = `render-${selectedTab}-start`;
      performance.mark(markName);
      
      return () => {
        if (performance.measure) {
          try {
            performance.measure(`${selectedTab}-tab-render-time`, markName);
          } catch (e) {
            console.error('Performance measurement error:', e);
          }
        }
      };
    }
  }, [selectedTab]);

  // Render the appropriate tab with Suspense
  return (
    <Suspense fallback={<TabLoadingPlaceholder />}>
      {selectedTab === 'home' && (
        <HomeTab
          transactions={transactions}
          totalIncome={transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)}
          totalExpense={transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)}
          totalInvestment={transactions.filter(t => t.type === 'investment').reduce((sum, t) => sum + t.amount, 0)}
          totalLiability={transactions.filter(t => t.type === 'liability').reduce((sum, t) => sum + t.amount, 0)}
          budgetLimits={budgetLimits}
          formatCurrency={formatCurrency}
          getCategoryIcon={getCategoryIcon}
          categories={categories}
          showLimitModal={showLimitModal}
          setShowLimitModal={setShowLimitModal}
          newLimitCategory={newLimitCategory}
          setNewLimitCategory={setNewLimitCategory}
          newLimitAmount={newLimitAmount}
          setNewLimitAmount={setNewLimitAmount}
          notificationThreshold={notificationThreshold}
          setNotificationThreshold={setNotificationThreshold}
          handleAddLimit={handleAddLimit}
        />
      )}
      {selectedTab === 'analytics' && (
        <AnalyticsTab
          darkMode={darkMode}
          chartView={chartView}
          setChartView={setChartView}
          formatCurrency={formatCurrency}
        />
      )}
      {selectedTab === 'goals' && (
        <GoalsTab
          goals={goals}
          formatCurrency={formatCurrency}
          showGoalModal={showGoalModal}
          setShowGoalModal={setShowGoalModal}
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
          handleAddGoal={handleAddGoal}
        />
      )}
      {selectedTab === 'profile' && (
        <ProfileTab
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      )}
    </Suspense>
  );
};

export default TabContent;
