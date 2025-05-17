import React from 'react';

interface TransactionModalProps {
  showAddModal: boolean;
  setShowAddModal: (show: boolean) => void;
  transactionType: string;
  setTransactionType: (type: string) => void;
  transactionSubType: string;
  setTransactionSubType: (subType: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  category: string;
  setCategory: (category: string) => void;
  date: string;
  setDate: (date: string) => void;
  note: string;
  setNote: (note: string) => void;
  handleAddTransaction: () => void;
  categories: any;
}

// Use React.memo to prevent unnecessary re-renders
const TransactionModal: React.FC<TransactionModalProps> = React.memo(({
  showAddModal,
  setShowAddModal,
  transactionType,
  setTransactionType,
  transactionSubType,
  setTransactionSubType,
  amount,
  setAmount,
  category,
  setCategory,
  date,
  setDate,
  note,
  setNote,
  handleAddTransaction,
  categories
}) => {
  if (!showAddModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-11/12 max-w-md p-5 shadow-xl transform transition-all duration-300 animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Add Transaction</h3>
          <button
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer !rounded-button"
            onClick={() => setShowAddModal(false)}
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        <div className="mb-4">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
            {['expense', 'income'].map(type => (
              <button
                key={type}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-md ${
                  transactionType === type
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
                onClick={() => {
                  setTransactionType(type);
                  setTransactionSubType(type);
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          {transactionType === 'expense' && (
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
              {['expense', 'investment', 'liability'].map(subType => (
                <button
                  key={subType}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-md ${
                    transactionSubType === subType
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                  onClick={() => setTransactionSubType(subType)}
                >
                  {subType.charAt(0).toUpperCase() + subType.slice(1)}
                </button>
              ))}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 dark:text-gray-400">₹</span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="block w-full pl-8 pr-12 py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {categories[transactionSubType as keyof typeof categories]?.slice(0, 8).map((cat: { id: React.Key | null | undefined; name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; icon: any; }) => (
                <div
                  key={cat.id}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transform transition-all duration-200 hover:scale-[1.05] ${
                    category === cat.name
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                  onClick={() => setCategory(cat.name as string)}
                >
                  <i className={`${cat.icon} text-xl mb-1`}></i>
                  <span className="text-xs whitespace-nowrap overflow-hidden text-overflow-ellipsis w-full text-center">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input
              type="date"
              className="block w-full px-4 py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note (Optional)</label>
            <input
              type="text"
              className="block w-full px-4 py-3 border-none bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
              placeholder="Add a note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <button
          className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg shadow-sm transition duration-300 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] !rounded-button"
          onClick={handleAddTransaction}
        >
          Save Transaction
        </button>
      </div>
    </div>
  );
});

// Add a display name for better debugging
TransactionModal.displayName = 'TransactionModal';

export default TransactionModal;
