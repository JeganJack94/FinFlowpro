import React from 'react';

interface GoalsTabProps {
  goals: any[];
  formatCurrency: (amount: number) => string;
  showGoalModal: boolean;
  setShowGoalModal: (show: boolean) => void;
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
  handleAddGoal: () => void;
}

// Use React.memo to prevent unnecessary re-renders
const GoalsTab: React.FC<GoalsTabProps> = React.memo(({
  goals,
  formatCurrency,
  showGoalModal,
  setShowGoalModal,
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
  handleAddGoal
}) => {
  // Split list into activeGoals and goalSuggestions to enable code splitting
  const activeGoals = goals;
  const goalSuggestions = [
    { name: 'Retirement Fund', icon: 'fa-solid fa-umbrella-beach', description: 'Start saving for your retirement' },
    { name: 'Education Fund', icon: 'fa-solid fa-graduation-cap', description: 'Save for future education expenses' },
    { name: 'Home Down Payment', icon: 'fa-solid fa-home', description: 'Save for a down payment on a home' }
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Financial Goals</h2>
        <div className="space-y-4">
          {activeGoals.map(goal => {
            const progress = (goal.current / goal.target) * 100;
            return (
              <div key={goal.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-4 border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-800 dark:text-white">{goal.name}</span>
                  <span className="text-gray-600 dark:text-gray-300">{formatCurrency(goal.current)} / {formatCurrency(goal.target)}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                  <div
                    className="h-2.5 rounded-full bg-purple-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{progress.toFixed(0)}% complete</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Target: {goal.deadline}</span>
                </div>
              </div>
            );
          })}
        </div>
        <button
          id="addGoalButton"
          className="mt-4 w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg shadow-sm transition duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] !rounded-button"
          onClick={() => setShowGoalModal(true)}
        >
          <i className="fa-solid fa-plus mr-2"></i> Add New Goal
        </button>
        {showGoalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
            <div className="bg-white dark:bg-gray-800 rounded-xl w-11/12 max-w-md p-5 shadow-xl transform transition-all duration-300 animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Add New Goal</h3>
                <button
                  id="closeGoalModal"
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer !rounded-button"
                  onClick={() => setShowGoalModal(false)}
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="mb-4">
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { icon: 'fa-solid fa-house', name: 'Home' },
                    { icon: 'fa-solid fa-car', name: 'Vehicle' },
                    { icon: 'fa-solid fa-graduation-cap', name: 'Education' },
                    { icon: 'fa-solid fa-umbrella-beach', name: 'Vacation' },
                    { icon: 'fa-solid fa-chart-line', name: 'Investment' },
                    { icon: 'fa-solid fa-gift', name: 'Gift' },
                    { icon: 'fa-solid fa-piggy-bank', name: 'Savings' },
                    { icon: 'fa-solid fa-heart', name: 'Other' }
                  ].map((cat) => (
                    <div
                      key={cat.name}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-[1.05] ${
                        goalCategory === cat.name
                          ? 'bg-purple-100 dark:bg-purple-900 text-purple-500'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                      onClick={() => setGoalCategory(cat.name)}
                    >
                      <i className={`${cat.icon} text-xl mb-1`}></i>
                      <span className="text-xs whitespace-nowrap overflow-hidden text-overflow-ellipsis w-full text-center">
                        {cat.name}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Goal Name</label>
                    <input
                      id="goalName"
                      type="text"
                      className="block w-full px-4 py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter goal name"
                      value={goalName}
                      onChange={(e) => setGoalName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Amount</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400">₹</span>
                      </div>
                      <input
                        id="targetAmount"
                        type="text"
                        className="block w-full pl-8 pr-12 py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        placeholder="0.00"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Savings</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400">₹</span>
                      </div>
                      <input
                        id="currentAmount"
                        type="text"
                        className="block w-full pl-8 pr-12 py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                        placeholder="0.00"
                        value={currentAmount}
                        onChange={(e) => setCurrentAmount(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Date</label>
                    <input
                      id="targetDate"
                      type="date"
                      className="block w-full px-4 py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (Optional)</label>
                    <textarea
                      id="goalNote"
                      className="block w-full px-4 py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      placeholder="Add a note about your goal"
                      value={goalNote}
                      onChange={(e) => setGoalNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  id="cancelGoal"
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg shadow-sm transition duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] !rounded-button"
                  onClick={() => setShowGoalModal(false)}
                >
                  Cancel
                </button>
                <button
                  id="saveGoal"
                  className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg shadow-sm transition duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] !rounded-button"
                  onClick={handleAddGoal}
                >
                  Save Goal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Goal Suggestions</h2>
        <div className="space-y-3">
          {goalSuggestions.map((suggestion, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:bg-purple-50 dark:hover:bg-purple-900">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                <i className={`${suggestion.icon} text-purple-500`}></i>
              </div>
              <div>
                <div className="font-medium text-gray-800 dark:text-white">{suggestion.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{suggestion.description}</div>
              </div>
              <div className="ml-auto">
                <i className="fa-solid fa-plus text-purple-500"></i>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default GoalsTab;
