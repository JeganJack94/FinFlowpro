import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Define types
export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Categories {
  income: Category[];
  expense: Category[];
  investment: Category[];
  liability: Category[];
}

export interface Transaction {
  id: number;
  type: string;
  category: string;
  amount: number;
  date: string;
  note: string;
}

export interface BudgetLimit {
  category: string;
  limit: number;
  spent: number;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  category: string;
  note: string;
  userId?: string;
  createdAt?: any;
}

interface FinanceContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  formatCurrency: (amount: number) => string;
  chartView: string;
  setChartView: React.Dispatch<React.SetStateAction<string>>;
  transactions: Transaction[];
  categories: Categories;
  budgetLimits: BudgetLimit[];
  goals: Goal[];
  totalIncome: number;
  totalExpense: number;
  totalInvestment: number;
  totalLiability: number;
  totalBalance: number;
  getCategoryIcon: (categoryName: string, type: string) => string;
  showAddModal: boolean;
  setShowAddModal: React.Dispatch<React.SetStateAction<boolean>>;
  showLimitModal: boolean;
  setShowLimitModal: React.Dispatch<React.SetStateAction<boolean>>;
  showGoalModal: boolean;
  setShowGoalModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}

interface FinanceProviderProps {
  children: ReactNode;
}

export function FinanceProvider({ children }: FinanceProviderProps) {
  // Check if dark mode is enabled in localStorage, default to system preference if not set
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [darkMode, setDarkMode] = useState<boolean>(
    localStorage.getItem('darkMode') ? 
    localStorage.getItem('darkMode') === 'true' : 
    prefersDarkMode
  );
  const [chartView, setChartView] = useState<string>('monthly');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);

  // Apply dark mode theme to the entire application
  useEffect(() => {
    // Apply dark mode class to the HTML document element
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  // Sample data
  const transactions: Transaction[] = [
    { id: 1, type: 'income', category: 'Salary', amount: 350000, date: '2025-05-15', note: 'Monthly salary' },
    { id: 2, type: 'expense', category: 'Rent', amount: 120000, date: '2025-05-01', note: 'Monthly rent' },
    { id: 3, type: 'expense', category: 'Groceries', amount: 8550, date: '2025-05-14', note: 'Weekly groceries' },
    { id: 4, type: 'expense', category: 'Dining', amount: 4275, date: '2025-05-13', note: 'Dinner with friends' },
    { id: 5, type: 'investment', category: 'Stocks', amount: 50000, date: '2025-05-10', note: 'HDFC shares' },
    { id: 6, type: 'expense', category: 'Transportation', amount: 3000, date: '2025-05-12', note: 'Uber rides' },
    { id: 7, type: 'liability', category: 'Credit Card', amount: 25000, date: '2025-05-08', note: 'HDFC Credit Card' }
  ];

  const categories: Categories = {
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

  const budgetLimits: BudgetLimit[] = [
    { category: 'Food', limit: 50000, spent: 35000 },
    { category: 'Shopping', limit: 30000, spent: 28000 },
    { category: 'Entertainment', limit: 20000, spent: 12000 }
  ];

  const goals: Goal[] = [
    { id: '1', name: 'Emergency Fund', target: 300000, current: 150000, deadline: '2025-12-31', category: 'Savings', note: '6 months expenses' },
    { id: '2', name: 'Vacation', target: 150000, current: 75000, deadline: '2025-08-15', category: 'Travel', note: 'Bali trip' },
    { id: '3', name: 'New Laptop', target: 120000, current: 40000, deadline: '2025-10-01', category: 'Electronics', note: 'MacBook Pro' }
  ];

  // Calculations
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalInvestment = transactions.filter(t => t.type === 'investment').reduce((sum, t) => sum + t.amount, 0);
  const totalLiability = transactions.filter(t => t.type === 'liability').reduce((sum, t) => sum + t.amount, 0);
  const totalBalance = totalIncome - totalExpense;

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getCategoryIcon = (categoryName: string, type: string) => {
    const categoryList = categories[type as keyof typeof categories] || categories.expense;
    const found = categoryList.find(c => c.name === categoryName);
    return found ? found.icon : 'fa-solid fa-question';
  };

  const value = {
    darkMode,
    toggleDarkMode,
    formatCurrency,
    chartView,
    setChartView,
    transactions,
    categories,
    budgetLimits,
    goals,
    totalIncome,
    totalExpense,
    totalInvestment,
    totalLiability,
    totalBalance,
    getCategoryIcon,
    showAddModal,
    setShowAddModal,
    showLimitModal,
    setShowLimitModal,
    showGoalModal,
    setShowGoalModal
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export default FinanceContext;
