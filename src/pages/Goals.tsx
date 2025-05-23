import React, { useState, useEffect, useCallback } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import GoalModal from '../components/GoalModal';
import ProgressUpdateModal from '../components/ProgressUpdateModal';

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

  // Fetch goals from Firestore
  useEffect(() => {
    if (!currentUser) {
      setGoals([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const goalsQuery = query(
      collection(db, `users/${currentUser.uid}/goals`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(goalsQuery, (snapshot) => {
      const goalsData: Goal[] = [];
      snapshot.forEach((doc) => {
        goalsData.push({
          id: doc.id,
          ...doc.data() as Omit<Goal, 'id'>
        });
      });
      setGoals(goalsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching goals:", error);
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
    </div>
  );
};

export default Goals;
