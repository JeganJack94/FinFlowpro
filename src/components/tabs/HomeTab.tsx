import React from 'react';

interface HomeTabProps {
  transactions: any[];
  totalIncome: number;
  totalExpense: number;
  totalInvestment: number;
  totalLiability: number;
  budgetLimits: any[];
  formatCurrency: (amount: number) => string;
  getCategoryIcon: (categoryName: string, type: string) => string;
  categories: any;
  showLimitModal: boolean;
  setShowLimitModal: (show: boolean) => void;
  newLimitCategory: string;
  setNewLimitCategory: (category: string) => void;
  newLimitAmount: string;
  setNewLimitAmount: (amount: string) => void;
  notificationThreshold: string;
  setNotificationThreshold: (threshold: string) => void;
  handleAddLimit: () => void;
}

// Use React.memo to prevent unnecessary re-renders
const HomeTab: React.FC<HomeTabProps> = React.memo(({
  transactions,
  totalIncome,
  totalExpense,
  totalInvestment,
  totalLiability,
  budgetLimits,
  formatCurrency,
  getCategoryIcon,
  categories,
  showLimitModal,
  setShowLimitModal,
  newLimitCategory,
  setNewLimitCategory,
  newLimitAmount,
  setNewLimitAmount,
  notificationThreshold,
  setNotificationThreshold,
  handleAddLimit
}) => {
  // Calculate total balance
  const totalBalance = totalIncome - totalExpense;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-5 mb-2 transform transition-all duration-300 hover:scale-[1.02]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100 dark:bg-purple-900/20 rounded-full -mr-16 -mt-16 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-100 dark:bg-purple-900/20 rounded-full -ml-12 -mb-12 opacity-50"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <i className="fa-solid fa-wallet text-purple-500 text-2xl mr-2"></i>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">FinFlow</h1>
            </div>
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-bell text-gray-600 dark:text-gray-400 text-lg"></i>
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Balance</div>
          <div className="text-3xl font-bold text-gray-800 dark:text-white mb-3 animate-fadeIn">
            {formatCurrency(totalBalance)}
          </div>
          <div className="flex justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mr-2">
                <i className="fa-solid fa-arrow-down text-purple-500"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">Income</span>
                <span className="text-lg font-semibold text-purple-500 animate-slideIn">+{formatCurrency(totalIncome)}</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mr-2">
                <i className="fa-solid fa-arrow-up text-red-500"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400">Expenses</span>
                <span className="text-lg font-semibold text-red-500 animate-slideIn">-{formatCurrency(totalExpense)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="flex space-x-3 mb-4 overflow-x-auto py-2 will-change-scroll">
        <div className="flex-shrink-0 w-32 h-24 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-md p-3 flex flex-col justify-between transform transition-all duration-300 hover:scale-[1.05]">
          <i className="fa-solid fa-money-bill-wave text-white text-xl"></i>
          <div>
            <div className="text-xs text-purple-100">Income</div>
            <div className="text-white font-semibold">{formatCurrency(totalIncome)}</div>
          </div>
        </div>
        <div className="flex-shrink-0 w-32 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-md p-3 flex flex-col justify-between transform transition-all duration-300 hover:scale-[1.05]">
          <i className="fa-solid fa-credit-card text-white text-xl"></i>
          <div>
            <div className="text-xs text-red-100">Expense</div>
            <div className="text-white font-semibold">{formatCurrency(totalExpense)}</div>
          </div>
        </div>
        <div className="flex-shrink-0 w-32 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-md p-3 flex flex-col justify-between transform transition-all duration-300 hover:scale-[1.05]">
          <i className="fa-solid fa-chart-line text-white text-xl"></i>
          <div>
            <div className="text-xs text-blue-100">Investment</div>
            <div className="text-white font-semibold">{formatCurrency(totalInvestment)}</div>
          </div>
        </div>
        <div className="flex-shrink-0 w-32 h-24 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-xl shadow-md p-3 flex flex-col justify-between transform transition-all duration-300 hover:scale-[1.05]">
          <i className="fa-solid fa-hand-holding-usd text-white text-xl"></i>
          <div>
            <div className="text-xs text-yellow-100">Liability</div>
            <div className="text-white font-semibold">{formatCurrency(totalLiability)}</div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Recent Transactions</h2>
        <div className="space-y-3">
          {transactions.slice(0, 5).map(transaction => (
            <div key={transaction.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 flex items-center justify-between cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
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
              <div className={`font-semibold ${
                transaction.type === 'income' ? 'text-purple-500' :
                transaction.type === 'expense' ? 'text-red-500' :
                transaction.type === 'investment' ? 'text-blue-500' :
                'text-yellow-500'
              }`}>
                {transaction.type === 'income' || transaction.type === 'investment' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Limits */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Budget Limits</h2>
          <button 
            className="text-purple-500 hover:text-purple-600 transition-colors duration-200 !rounded-button"
            onClick={() => setShowLimitModal(true)}
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
        <div className="space-y-4">
          {budgetLimits.map((budget, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transform transition-all duration-300 hover:scale-[1.02]">
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-800 dark:text-white">{budget.category}</span>
                <span className="text-gray-600 dark:text-gray-300">{formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${
                    (budget.spent / budget.limit) > 0.9 ? 'bg-red-500' :
                    (budget.spent / budget.limit) > 0.7 ? 'bg-yellow-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${Math.min(100, (budget.spent / budget.limit) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {showLimitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-11/12 max-w-md p-5 shadow-xl transform transition-all duration-300 animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Add Budget Limit</h3>
                <button
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer !rounded-button"
                  onClick={() => setShowLimitModal(false)}
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.expense.slice(0, 8).map((cat: { id: React.Key | null | undefined; name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; icon: any; }) => (
                      <div
                        key={cat.id}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-[1.05] ${
                          newLimitCategory === cat.name
                            ? 'bg-purple-100 dark:bg-purple-900 text-purple-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                        onClick={() => setNewLimitCategory(cat.name as string)}
                      >
                        <i className={`${cat.icon} text-xl mb-1`}></i>
                        <span className="text-xs whitespace-nowrap overflow-hidden text-overflow-ellipsis w-full text-center">{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Limit</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">₹</span>
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-8 pr-12 py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                      value={newLimitAmount}
                      onChange={(e) => setNewLimitAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notification Threshold</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="5"
                      className="w-full"
                      value={notificationThreshold}
                      onChange={(e) => setNotificationThreshold(e.target.value)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300 w-12">{notificationThreshold}%</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg shadow-sm transition duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] !rounded-button"
                  onClick={() => setShowLimitModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg shadow-sm transition duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] !rounded-button"
                  onClick={handleAddLimit}
                >
                  Save Limit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animation CSS */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
});

export default HomeTab;
