import React, { useState, useEffect } from 'react';

interface ProgressUpdateModalProps {
  showModal: boolean;
  onClose: () => void;
  onUpdate: (amount: number) => void;
  currentAmount: number;
  targetAmount: number;
}

const ProgressUpdateModal: React.FC<ProgressUpdateModalProps> = ({
  showModal,
  onClose,
  onUpdate,
  currentAmount,
  targetAmount
}) => {
  const [amount, setAmount] = useState(currentAmount.toString());
  const [error, setError] = useState('');

  useEffect(() => {
    if (showModal) {
      setAmount(currentAmount.toString());
      setError('');
    }
  }, [showModal, currentAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (parsedAmount < 0) {
      setError('Amount cannot be negative');
      return;
    }
    
    if (parsedAmount > targetAmount) {
      setError(`Amount cannot exceed target (${targetAmount})`);
      return;
    }
    
    onUpdate(parsedAmount);
    onClose();
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-xs p-4 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-medium text-gray-800 dark:text-white">
            Update Progress
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded-lg mb-3 text-xs">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-1">
              Current Progress
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              placeholder="Enter amount"
              min="0"
              max={targetAmount}
              required
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Target: {targetAmount}
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-purple-500 text-sm text-white rounded-lg hover:bg-purple-600"
            >
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgressUpdateModal;