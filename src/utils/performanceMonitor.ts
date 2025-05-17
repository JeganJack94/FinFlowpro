// Performance monitoring module for FinFlow app
// This module tracks key performance metrics and sends them to the console (or any analytics service)

/**
 * Interface for performance metrics
 */
interface PerformanceMetrics {
  LCP: number | null;
  FID: number | null;
  CLS: number | null;
  TTFB: number | null;
  FCP: number | null;
  componentRenderTimes: Record<string, number>;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics = {
    LCP: null,
    FID: null,
    CLS: null,
    TTFB: null,
    FCP: null,
    componentRenderTimes: {}
  };

  private constructor() {
    // Initialize performance observers if available
    this.initPerformanceObservers();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Initialize all performance observers
   */
  private initPerformanceObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      console.warn('Performance APIs not supported in this environment');
      return;
    }

    // Observe Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((entries) => {
        const lcpEntry = entries.getEntries().pop();
        if (lcpEntry) {
          this.metrics.LCP = lcpEntry.startTime;
          console.log(`LCP: ${this.metrics.LCP}ms`);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP observer setup failed:', e);
    }

    // Observe First Input Delay
    try {
      const fidObserver = new PerformanceObserver((entries) => {
        const fidEntry = entries.getEntries().pop();
        if (fidEntry) {
          // @ts-ignore - first-input is not in the TypeScript types yet
          this.metrics.FID = fidEntry.processingStart - fidEntry.startTime;
          console.log(`FID: ${this.metrics.FID}ms`);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('FID observer setup failed:', e);
    }

    // Observe Cumulative Layout Shift
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) {
          // @ts-ignore - layout-shift is not in the TypeScript types yet
          if (!entry.hadRecentInput) {
            // @ts-ignore
            clsValue += entry.value;
            this.metrics.CLS = clsValue;
          }
        }
        console.log(`CLS: ${this.metrics.CLS}`);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      console.warn('CLS observer setup failed:', e);
    }

    // Track First Contentful Paint and Time to First Byte
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        this.metrics.TTFB = navEntry.responseStart;
        console.log(`TTFB: ${this.metrics.TTFB}ms`);
      }

      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.metrics.FCP = fcpEntry.startTime;
        console.log(`FCP: ${this.metrics.FCP}ms`);
      }
    } catch (e) {
      console.warn('Navigation timing metrics collection failed:', e);
    }

    // Observe custom component render times
    try {
      const perfObserver = new PerformanceObserver((entries) => {
        for (const entry of entries.getEntries()) {
          if (entry.name.includes('-render-time')) {
            const componentName = entry.name.split('-render-time')[0];
            this.metrics.componentRenderTimes[componentName] = entry.duration;
            console.log(`Component ${componentName} render time: ${entry.duration}ms`);
          }
        }
      });
      perfObserver.observe({ entryTypes: ['measure'] });
    } catch (e) {
      console.warn('Component render time observer setup failed:', e);
    }
  }

  /**
   * Mark the start of a custom performance measurement
   */
  public markStart(markName: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${markName}-start`);
    }
  }

  /**
   * Mark the end of a custom performance measurement and record it
   */
  public markEnd(markName: string): void {
    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${markName}-end`);
      try {
        performance.measure(markName, `${markName}-start`, `${markName}-end`);
        const entries = performance.getEntriesByName(markName, 'measure');
        if (entries.length > 0) {
          console.log(`${markName}: ${entries[0].duration}ms`);
        }
      } catch (e) {
        console.warn(`Error measuring ${markName}:`, e);
      }
    }
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Log all current metrics to console
   */
  public logMetrics(): void {
    console.log('Current Performance Metrics:', this.metrics);
  }

  /**
   * Report metrics to a service (placeholder for actual implementation)
   */
  public reportMetrics(): void {
    // In a real app, send this data to your analytics service
    console.log('Reporting metrics to analytics service:', this.metrics);
  }
}

export default PerformanceMonitor.getInstance();
