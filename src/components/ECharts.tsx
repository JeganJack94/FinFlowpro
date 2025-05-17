import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import {
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Only register the components we need to minimize bundle size
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  ToolboxComponent,
  CanvasRenderer
]);

interface EChartsProps {
  id: string;
  options: any;
  darkMode?: boolean;
  onChartReady?: (chart: any) => void;
}

// Use requestIdleCallback to render charts when browser is idle
const useIdleCallback = (callback: () => void, deps: React.DependencyList = []) => {
  useEffect(() => {
    // Use requestIdleCallback or fallback to setTimeout
    const handle = 'requestIdleCallback' in window
      ? window.requestIdleCallback(() => callback())
      : setTimeout(() => callback(), 0);

    return () => {
      if ('requestIdleCallback' in window) {
        window.cancelIdleCallback(handle as any);
      } else {
        clearTimeout(handle);
      }
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
};

const ECharts: React.FC<EChartsProps> = ({ 
  id, 
  options, 
  darkMode = false, 
  onChartReady 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<echarts.ECharts | null>(null);

  // Initialize chart with requestIdleCallback
  useIdleCallback(() => {
    if (!chartRef.current) return;

    // Check if chart already exists
    if (chart) {
      chart.dispose();
    }

    // Create chart instance
    const newChart = echarts.init(chartRef.current, darkMode ? 'dark' : undefined);
    
    // Apply options
    newChart.setOption(options);
    
    // Store chart instance
    setChart(newChart);
    
    // Notify parent when chart is ready
    if (onChartReady) {
      onChartReady(newChart);
    }

    // Handle resize
    const handleResize = () => {
      newChart.resize();
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      newChart.dispose();
    };
  }, [id, darkMode, JSON.stringify(options)]);

  // Update options when they change
  useEffect(() => {
    if (!chart) return;
    chart.setOption(options);
  }, [chart, options]);

  // Update theme when darkMode changes
  useEffect(() => {
    if (!chart) return;
    chart.dispose();
    const newChart = echarts.init(chartRef.current!, darkMode ? 'dark' : undefined);
    newChart.setOption(options);
    setChart(newChart);
    
    // Handle resize
    const handleResize = () => {
      newChart.resize();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [darkMode]);

  return <div ref={chartRef} id={id} style={{ width: '100%', height: '100%' }} />;
};

export default ECharts;
