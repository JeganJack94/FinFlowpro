import React, { useEffect, useRef, useState } from 'react';
import { lazy, Suspense } from 'react';

// Import echarts dynamically to reduce initial bundle size
const ECharts = lazy(() => import('../components/ECharts'));

// Create a loading placeholder with the exact same dimensions
const ChartPlaceholder: React.FC<{height: string | number, width: string | number}> = ({ height, width }) => (
  <div 
    className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
    style={{ height, width }}
  >
    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
    </svg>
  </div>
);

interface LazyChartsProps {
  options: any;
  id: string;
  height?: string | number;
  width?: string | number;
  darkMode?: boolean;
  className?: string;
  onChartReady?: (chart: any) => void;
}

// Wrapper component for ECharts that uses Intersection Observer for lazy loading
const LazyCharts: React.FC<LazyChartsProps> = ({ 
  options, 
  id, 
  height = '300px', 
  width = '100%',
  darkMode = false,
  className = '',
  onChartReady
}) => {
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set up intersection observer to detect when chart comes into view
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          // Once visible, disconnect the observer
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '100px', // Load 100px before it comes into view
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`lazy-chart-container ${className}`}
      style={{ height, width }}
    >
      {visible ? (
        <Suspense fallback={<ChartPlaceholder height={height} width={width} />}>
          <ECharts
            id={id}
            options={options}
            darkMode={darkMode}
            onChartReady={onChartReady}
          />
        </Suspense>
      ) : (
        <ChartPlaceholder height={height} width={width} />
      )}
    </div>
  );
};

export default LazyCharts;
