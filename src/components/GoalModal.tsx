import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';

interface GoalModalProps {
  showModal: boolean;
  onClose: () => void;
  onSave: (goal: any) => void;
  initialCategory?: string | null;
}

const GoalModal: React.FC<GoalModalProps> = ({ showModal, onClose, onSave, initialCategory = null }) => {
  const { currentUser } = useAuth();
  // Get a default date 1 year from now for the target date
  const getDefaultTargetDate = (): string => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date.toISOString().split('T')[0];
  };

  const [goalCategory, setGoalCategory] = useState<string>(initialCategory || '');
  const [goalName, setGoalName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currentAmount, setCurrentAmount] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>(getDefaultTargetDate());
  const [goalNote, setGoalNote] = useState<string>('');
  
  // Update category when initialCategory changes
  React.useEffect(() => {
    if (initialCategory) {
      setGoalCategory(initialCategory);
    }
  }, [initialCategory]);
  
  // Add keyboard support for closing modal with Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) {
        onClose();
      }
    };
    
    if (showModal) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showModal, onClose]);

  const handleSave = async () => {
    if (!goalName || !targetAmount || !targetDate || !goalCategory) {
      // Show validation error or alert here
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Parse amounts, handling potential invalid inputs
      const parsedTarget = parseFloat(targetAmount);
      const parsedCurrent = parseFloat(currentAmount) || 0;
      
      if (isNaN(parsedTarget) || parsedTarget <= 0) {
        alert('Please enter a valid target amount');
        return;
      }
      
      if (isNaN(parsedCurrent) || parsedCurrent < 0) {
        alert('Please enter a valid current amount');
        return;
      }
      
      const newGoal = {
        name: goalName,
        target: parsedTarget,
        current: parsedCurrent,
        deadline: targetDate,
        category: goalCategory,
        note: goalNote,
        userId: currentUser?.uid,
        createdAt: serverTimestamp()
      };

      if (currentUser) {
        const docRef = await addDoc(collection(db, 'goals'), newGoal);
        onSave({
          ...newGoal,
          id: docRef.id
        });
        
        // Reset form
        setGoalCategory('');
        setGoalName('');
        setTargetAmount('');
        setCurrentAmount('');
        setTargetDate('');
        setGoalNote('');
        onClose();
      } else {
        alert('You must be logged in to add goals');
      }
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('An error occurred while saving your goal. Please try again.');
    }
  };

  if (!showModal) return null;

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20" onClick={handleOutsideClick}>
      <div className="bg-white dark:bg-gray-800 rounded-xl w-11/12 max-w-md p-5 shadow-xl transform transition-all duration-300 animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Add New Goal</h3>
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
            onClick={onClose}
          >
            <i className="fa-solid fa-xmark"></i>
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
                type="date"
                className="block w-full px-4 py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (Optional)</label>
              <textarea
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
            className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg shadow-sm transition duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg shadow-sm transition duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
            onClick={handleSave}
          >
            Save Goal
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalModal;
