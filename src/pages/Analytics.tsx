import React, { useEffect, useRef, useState, Component, useCallback } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { useAuth } from '../contexts/AuthContext';
import * as echarts from 'echarts';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: Timestamp;
  description: string;
}

// Error Boundary component to prevent chart errors from crashing the app
class ChartErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // We can use the error here or add additional logging if needed
    console.debug('Chart error caught by error boundary:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.log('Chart Error:', error);
    console.log('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          <h3 className="font-semibold mb-2">Chart rendering error</h3>
          <p>There was an error rendering the chart. Try refreshing the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
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

  // Process transactions data for charts and analytics
  const processTransactionsData = useCallback((transactions: Transaction[]) => {
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
  }, []);

  // Helper function to get date range based on selected view
  const getDateRangeForView = useCallback((view: string) => {
    const now = new Date();
    let startDate = new Date();
    
    switch (view) {
      case 'daily':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }
    
    const adjustedNow = new Date();
    
    return {
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(adjustedNow)
    };
  }, []);

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

  // Chart initialization and update with improved cleanup
  useEffect(() => {
    if (!chartRef.current || loading) return;
    
    // Store a reference to the current DOM element
    const chartDom = chartRef.current;
    let chartInstance: echarts.ECharts | null = null;
    
    // Use a timeout to ensure chart renders properly
    const timer = setTimeout(() => {
      // Double-check that the DOM element is still valid
      if (!chartDom || !document.body.contains(chartDom)) return;
      
      try {
        // Safely dispose any existing chart instances
        echarts.dispose(chartDom);
        
        // Create a fresh chart instance
        chartInstance = echarts.init(chartDom);
        
        // Prepare chart data
        const chartData = categoryTotals.length > 0 
          ? categoryTotals.slice(0, 5).map(item => ({
              value: item.amount,
              name: item.category
            }))
          : [{ value: 0, name: 'No Data' }];
        
        // Configure chart options
        const option: echarts.EChartsOption = {
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'item' as const,
            formatter: (params: unknown) => {
              const param = params as { name: string; value: number; percent: number };
              return `${param.name}: ${formatCurrency(param.value)} (${param.percent}%)`;
            },
            textStyle: {
              color: darkMode ? '#E5E7EB' : '#374151'
            },
            backgroundColor: darkMode ? '#374151' : '#FFFFFF',
            borderColor: darkMode ? '#4B5563' : '#E5E7EB'
          },
          legend: {
            type: 'scroll',
            top: '10%',
            left: 'center',
            itemGap: 25,
            itemWidth: 14,
            itemHeight: 10,
            pageButtonPosition: 'end',
            pageButtonGap: 5,
            pageButtonItemGap: 5,
            pageIconColor: darkMode ? '#E5E7EB' : '#374151',
            pageIconInactiveColor: darkMode ? '#6B7280' : '#9CA3AF',
            pageTextStyle: {
              color: darkMode ? '#E5E7EB' : '#374151'
            },
            textStyle: {
              color: darkMode ? '#E5E7EB' : '#374151',
              fontSize: 12,
              fontWeight: 'normal'
            },
            padding: [5, 10, 20, 10]
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
                  fontWeight: 'bold',
                  color: darkMode ? '#E5E7EB' : '#374151'
                }
              },
              labelLine: {
                show: false
              },
              data: chartData,
              color: ['#9C27B0', '#BA68C8', '#CE93D8', '#E1BEE7', '#F3E5F5', '#7E57C2', '#5E35B1', '#3949AB']
            }
          ]
        };
        
        // Set options and check if instance is still valid before applying
        if (chartInstance && !chartInstance.isDisposed()) {
          chartInstance.setOption(option);
        }
      } catch (error) {
        console.debug('Chart initialization error:', error);
      }
    }, 50); // Slight delay for DOM stability
    
    // Handle window resize
    const handleResize = () => {
      if (chartInstance && !chartInstance.isDisposed() && chartDom && document.body.contains(chartDom)) {
        try {
          chartInstance.resize();
        } catch (error) {
          console.debug('Chart resize error:', error);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up function
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      
      // This check ensures we don't try to dispose a chart that doesn't exist
      if (chartInstance && !chartInstance.isDisposed()) {
        try {
          chartInstance.dispose();
        } catch (error) {
          console.debug('Chart cleanup error (safe to ignore):', error);
        }
      }
    };
  }, [darkMode, chartView, categoryTotals, loading, formatCurrency, processTransactionsData]);

  // Get transactions from Firestore based on user ID and view criteria
  useEffect(() => {
    if (!currentUser || !currentUser.uid) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { startDate, endDate } = getDateRangeForView(chartView);
    const transactionsRef = collection(db, `users/${currentUser.uid}/transactions`);

    const q = query(
      transactionsRef,
      where('type', '==', 'expense')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      try {
        const fetchedTransactions: Transaction[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          let txnDate: Timestamp | null = null;
          if (data.timestamp && typeof data.timestamp.toDate === 'function') {
            txnDate = data.timestamp;
          } else if (typeof data.date === 'string') {
            const parsed = new Date(data.date);
            if (!isNaN(parsed.getTime())) {
              txnDate = Timestamp.fromDate(parsed);
            }
          }
          if (!txnDate) return;
          if (
            txnDate.toMillis() < startDate.toMillis() ||
            txnDate.toMillis() > endDate.toMillis()
          ) {
            return;
          }
          let amount = Number(data.amount);
          if (isNaN(amount) || amount === null) amount = 0;
          fetchedTransactions.push({
            id: doc.id,
            type: data.type || 'expense',
            amount,
            category: data.category || 'Uncategorized',
            date: txnDate,
            description: data.note || data.description || ''
          });
        });
        fetchedTransactions.sort((a, b) => b.date.toMillis() - a.date.toMillis());
        processTransactionsData(fetchedTransactions);
      } catch (error) {
        console.debug('Error processing transactions:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.debug('Firestore subscription error:', error);
      setLoading(false);
    });
    
    return () => {
      unsubscribe();
    };
  }, [currentUser, chartView, processTransactionsData, getDateRangeForView]);

  return (
    <ChartErrorBoundary>
      <div className="flex flex-col gap-4 pb-20">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 transform transition-all duration-300 hover:shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Spending Analysis</h2>
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
              {['daily', 'weekly', 'monthly', 'yearly'].map(view => (
                <button
                  key={view}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 ${
                    chartView === view
                      ? 'bg-purple-500 text-gray-400 shadow dark:bg-purple-600 dark:text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setChartView(view)}
                  aria-pressed={chartView === view}
                  tabIndex={0}
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
            <div ref={chartRef} className="w-full h-96 mt-4"></div>
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
    </ChartErrorBoundary>
  );
};

export default Analytics;
