import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

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

interface GoalModalProps {
  showModal: boolean;
  onClose: () => void;
  onSave: () => void;
  initialCategory: string | null;
  goalToEdit: Goal | null;
}

const GoalModal: React.FC<GoalModalProps> = ({ 
  showModal, 
  onClose, 
  onSave, 
  initialCategory,
  goalToEdit
}) => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState(initialCategory || 'Savings');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to get default deadline (3 months from now)
  const getDefaultDeadline = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  };

  // Reset form when modal opens or when editing/creating mode changes
  useEffect(() => {
    if (showModal) {
      if (goalToEdit) {
        // Editing an existing goal
        setName(goalToEdit.name || '');
        setTarget(goalToEdit.target?.toString() || '');
        setCurrent(goalToEdit.current?.toString() || '0');
        setDeadline(goalToEdit.deadline || getDefaultDeadline());
        setCategory(goalToEdit.category || initialCategory || 'Savings');
        setNote(goalToEdit.note || '');
      } else {
        // Creating a new goal
        setName('');
        setTarget('');
        setCurrent('0');
        setDeadline(getDefaultDeadline());
        setCategory(initialCategory || 'Savings');
        setNote('');
      }
    }
  }, [showModal, initialCategory, goalToEdit]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !target || !deadline) {
      setError("Please fill out all required fields");
      return;
    }

    if (!currentUser) {
      setError("You must be logged in to save a goal");
      return;
    }

    const goalData = {
      name,
      target: Number(target),
      current: Number(current),
      deadline,
      category,
      note,
      userId: currentUser.uid,
      // Keep the original timestamp if editing, or create a new one if creating
      createdAt: goalToEdit?.createdAt || serverTimestamp()
    };

    try {
      setIsSaving(true);
      
      if (goalToEdit) {
        // Update existing goal
        const goalRef = doc(db, `users/${currentUser.uid}/goals`, goalToEdit.id);
        await updateDoc(goalRef, goalData);
      } else {
        // Create new goal
        await addDoc(collection(db, `users/${currentUser.uid}/goals`), goalData);
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving goal:", error);
      setError("Failed to save goal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {goalToEdit ? 'Edit Goal' : 'New Financial Goal'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSave}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
              Goal Name*
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. New Car"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
              Target Amount*
            </label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. 5000"
              min="1"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
              Current Progress
            </label>
            <input
              type="number"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. 1000"
              min="0"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
              Target Date*
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {['Savings', 'Home', 'Vehicle', 'Education', 'Vacation', 'Travel', 'Investment', 'Gift', 'Electronics', 'Other'].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
              Notes
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              placeholder="Optional notes about this goal"
            ></textarea>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  {goalToEdit ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                goalToEdit ? 'Update Goal' : 'Save Goal'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoalModal;
