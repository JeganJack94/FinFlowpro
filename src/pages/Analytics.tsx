import React, { useEffect, useRef, useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import * as echarts from 'echarts';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Timestamp } from 'firebase/firestore';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: Timestamp;
  description: string;
}

const Analytics: React.FC = () => {
  const { 
    chartView, 
    setChartView, 
    darkMode, 
    formatCurrency 
  } = useFinance();
  const { currentUser } = useAuth();
  const chartRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryTotals, setCategoryTotals] = useState<{category: string, amount: number, percentage: number}[]>([]);
  const [monthlyData, setMonthlyData] = useState<{month: string, amount: number}[]>([]);

  // Get transactions from Firestore based on user ID and view criteria
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    // Get time range based on selected view
    const { startDate, endDate } = getDateRangeForView(chartView);
    
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', currentUser.uid),
      where('type', '==', 'expense'),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'desc')
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedTransactions: Transaction[] = [];
      
      querySnapshot.forEach((doc) => {
        fetchedTransactions.push({
          id: doc.id,
          ...doc.data()
        } as Transaction);
      });
      
      processTransactionsData(fetchedTransactions);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching transactions: ", error);
      setLoading(false);
    });
    
    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [currentUser, chartView]);

  // Process transactions data for charts and analytics
  const processTransactionsData = (transactions: Transaction[]) => {
    // Calculate category totals
    const categories: Record<string, number> = {};
    let totalSpent = 0;

    transactions.forEach(transaction => {
      if (!categories[transaction.category]) {
        categories[transaction.category] = 0;
      }
      categories[transaction.category] += transaction.amount;
      totalSpent += transaction.amount;
    });

    // Convert to array and calculate percentages
    const categoryArray = Object.entries(categories).map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / totalSpent) * 100) || 0
    }));

    // Sort by amount (descending)
    categoryArray.sort((a, b) => b.amount - a.amount);
    setCategoryTotals(categoryArray);

    // Process monthly data
    const months: Record<string, number> = {};
    const last4Months = getLast4Months();
    
    // Initialize all months with 0
    last4Months.forEach(month => {
      months[month] = 0;
    });

    // Aggregate transactions by month
    transactions.forEach(transaction => {
      const month = new Date(transaction.date.toDate()).toLocaleString('default', { month: 'long' });
      if (months[month] !== undefined) {
        months[month] += transaction.amount;
      }
    });

    // Convert to array format for the chart
    const monthlyArray = Object.entries(months).map(([month, amount]) => ({
      month,
      amount
    }));

    setMonthlyData(monthlyArray);
  };

  // Helper function to get date range based on selected view
  const getDateRangeForView = (view: string) => {
    const now = new Date();
    let startDate = new Date();
    
    switch (view) {
      case 'daily':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }
    
    return {
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(now)
    };
  };

  // Helper function to get the names of the last 4 months
  const getLast4Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleString('default', { month: 'long' }));
    }
    return months;
  };

  // ECharts pie chart
  useEffect(() => {
    if (chartRef.current && !loading && categoryTotals.length > 0) {
      const myChart = echarts.init(chartRef.current);
      
      // Extract data for the chart
      const chartData = categoryTotals.slice(0, 5).map(item => ({
        value: item.amount,
        name: item.category
      }));
      
      const option = {
        backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
        tooltip: {
          trigger: 'item',
          formatter: (params: any) => {
            return `${params.name}: ${formatCurrency(params.value)} (${params.percent}%)`;
          }
        },
        legend: {
          top: '5%',
          left: 'center',
          textStyle: {
            color: darkMode ? '#E5E7EB' : '#374151'
          }
        },
        series: [
          {
            name: 'Spending',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: darkMode ? '#1F2937' : '#FFFFFF',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '16',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: chartData.length > 0 ? chartData : [{ value: 0, name: 'No Data' }],
            color: ['#9C27B0', '#BA68C8', '#CE93D8', '#E1BEE7', '#F3E5F5']
          }
        ]
      };
      
      myChart.setOption(option);
      
      const handleResize = () => {
        myChart.resize();
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        myChart.dispose();
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [darkMode, chartView, categoryTotals, loading, formatCurrency]);

  return (
    <div className="flex flex-col gap-4 pb-20">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 transform transition-all duration-300 hover:shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Spending Analysis</h2>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {['daily', 'weekly', 'monthly', 'yearly'].map(view => (
              <button
                key={view}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  chartView === view
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
                onClick={() => setChartView(view)}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div ref={chartRef} className="w-full h-64"></div>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 transform transition-all duration-300 hover:shadow-lg">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Top Spending Categories</h2>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : categoryTotals.length > 0 ? (
          <div className="space-y-3">
            {categoryTotals.slice(0, 4).map((item, index) => (
              <div key={index} className="flex items-center transform transition-all duration-300 hover:translate-x-1">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                  <i className={`${
                    item.category.toLowerCase().includes('food') ? 'fa-solid fa-utensils' :
                    item.category.toLowerCase().includes('rent') || item.category.toLowerCase().includes('home') ? 'fa-solid fa-home' :
                    item.category.toLowerCase().includes('transport') ? 'fa-solid fa-car' :
                    item.category.toLowerCase().includes('shop') ? 'fa-solid fa-shopping-bag' :
                    'fa-solid fa-receipt'
                  } text-purple-500`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium text-gray-800 dark:text-white">{item.category}</span>
                    <span className="text-gray-600 dark:text-gray-300">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-purple-500"
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No transaction data available for the selected period.
          </div>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 transform transition-all duration-300 hover:shadow-lg">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Monthly Comparison</h2>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        ) : monthlyData.length > 0 ? (
          <div className="flex justify-between items-center">
            {monthlyData.map((item, index) => {
              const maxAmount = Math.max(...monthlyData.map(d => d.amount || 0));
              const height = maxAmount > 0 ? Math.max(20, (item.amount / maxAmount) * 120) : 20;
              
              return (
                <div key={index} className="flex flex-col items-center transform transition-all duration-300 hover:scale-[1.05]">
                  <div className="text-xs text-gray-500 dark:text-gray-400">{item.month}</div>
                  <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg mt-1">
                    <div 
                      className="bg-purple-500 rounded-t-lg" 
                      style={{ height: `${height}px`, width: '100%' }}
                    ></div>
                  </div>
                  <div className="text-sm font-medium mt-1 text-gray-800 dark:text-white">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No monthly data available for comparison.
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
