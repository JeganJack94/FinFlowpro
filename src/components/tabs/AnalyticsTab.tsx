import React, { useEffect, useState } from 'react';
import LazyCharts from '../../components/LazyCharts';

interface AnalyticsTabProps {
  darkMode: boolean;
  chartView: string;
  setChartView: (view: string) => void;
  formatCurrency: (amount: number) => string;
}

// Use React.memo to prevent unnecessary re-renders
const AnalyticsTab: React.FC<AnalyticsTabProps> = React.memo(({
  darkMode,
  chartView,
  setChartView,
  formatCurrency
}) => {
  // Store chart options in state to prevent recreating on each render
  const [chartOptions, setChartOptions] = useState<any>(null);

  // Generate chart options based on dark mode and view
  useEffect(() => {
    setChartOptions({
      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
      tooltip: {
        trigger: 'item'
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
              fontSize: 14,
              fontWeight: 'bold',
              color: darkMode ? '#E5E7EB' : '#374151'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: 1048, name: 'Food' },
            { value: 735, name: 'Rent' },
            { value: 580, name: 'Transportation' },
            { value: 484, name: 'Shopping' },
            { value: 300, name: 'Utilities' }
          ],
          color: ['#9C27B0', '#BA68C8', '#CE93D8', '#E1BEE7', '#F3E5F5']
        }
      ]
    });
  }, [darkMode, chartView]);

  return (
    <div className="flex flex-col gap-4">
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
        
        {/* Use LazyCharts for optimized chart loading */}
        {chartOptions && (
          <LazyCharts 
            id="spending-chart" 
            options={chartOptions} 
            height="260px" 
            darkMode={darkMode} 
          />
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 transform transition-all duration-300 hover:shadow-lg">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Top Spending Categories</h2>
        <div className="space-y-3">
          {[
            { category: 'Food', amount: 35000, percentage: 28 },
            { category: 'Rent', amount: 120000, percentage: 45 },
            { category: 'Transportation', amount: 12000, percentage: 15 },
            { category: 'Shopping', amount: 28000, percentage: 12 }
          ].map((item, index) => (
            <div key={index} className="flex items-center transform transition-all duration-300 hover:translate-x-1">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                <i className={`${
                  item.category === 'Food' ? 'fa-solid fa-utensils' :
                  item.category === 'Rent' ? 'fa-solid fa-home' :
                  item.category === 'Transportation' ? 'fa-solid fa-car' :
                  'fa-solid fa-shopping-bag'
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
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 transform transition-all duration-300 hover:shadow-lg">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">Monthly Comparison</h2>
        <div className="flex justify-between items-center">
          {/* Use CSS hardware acceleration for smooth animations */}
          <div className="flex flex-col items-center transform will-change-transform transition-all duration-300 hover:scale-[1.05]">
            <div className="text-xs text-gray-500 dark:text-gray-400">April</div>
            <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg mt-1">
              <div className="bg-purple-500 rounded-t-lg h-24" style={{ width: '100%' }}></div>
            </div>
            <div className="text-sm font-medium mt-1 text-gray-800 dark:text-white">{formatCurrency(185000)}</div>
          </div>
          <div className="flex flex-col items-center transform will-change-transform transition-all duration-300 hover:scale-[1.05]">
            <div className="text-xs text-gray-500 dark:text-gray-400">May</div>
            <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg mt-1">
              <div className="bg-purple-500 rounded-t-lg h-32" style={{ width: '100%' }}></div>
            </div>
            <div className="text-sm font-medium mt-1 text-gray-800 dark:text-white">{formatCurrency(210000)}</div>
          </div>
          <div className="flex flex-col items-center transform will-change-transform transition-all duration-300 hover:scale-[1.05]">
            <div className="text-xs text-gray-500 dark:text-gray-400">June</div>
            <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg mt-1">
              <div className="bg-purple-500 rounded-t-lg h-20" style={{ width: '100%' }}></div>
            </div>
            <div className="text-sm font-medium mt-1 text-gray-800 dark:text-white">{formatCurrency(170000)}</div>
          </div>
          <div className="flex flex-col items-center transform will-change-transform transition-all duration-300 hover:scale-[1.05]">
            <div className="text-xs text-gray-500 dark:text-gray-400">July</div>
            <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg mt-1">
              <div className="bg-purple-500 rounded-t-lg h-28" style={{ width: '100%' }}></div>
            </div>
            <div className="text-sm font-medium mt-1 text-gray-800 dark:text-white">{formatCurrency(195000)}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AnalyticsTab;
