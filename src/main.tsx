import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { registerSW } from 'virtual:pwa-register';
import './utils/performanceMonitor'; // Import performance monitoring

// Use lazy loading for the main App component
const App = lazy(() => import('./App'));

// Initialize dark mode immediately before rendering to prevent flash
const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedDarkMode = localStorage.getItem('darkMode');
const shouldUseDarkMode = savedDarkMode === null ? prefersDarkMode : savedDarkMode === 'true';

if (shouldUseDarkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Add performance measurement
performance.mark('app-init-start');

// Register service worker with auto-update and better UX
const updateSW = registerSW({
  onNeedRefresh() {
    // Create a custom notification instead of using confirm()
    const updateNotification = document.createElement('div');
    updateNotification.className = 'fixed bottom-4 left-4 right-4 bg-purple-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between';
    updateNotification.innerHTML = `
      <span>New version available! Update for improved experience.</span>
      <button class="bg-white text-purple-500 px-3 py-1 rounded-md ml-4">Update</button>
    `;
    document.body.appendChild(updateNotification);
    
    // Handle update click
    updateNotification.querySelector('button')?.addEventListener('click', () => {
      updateSW(true);
      updateNotification.remove();
    });
  },
  onOfflineReady() {
    // Notify user that app is ready for offline use
    const offlineNotification = document.createElement('div');
    offlineNotification.className = 'fixed bottom-4 left-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center justify-between';
    offlineNotification.innerHTML = '<span>App ready to work offline!</span>';
    document.body.appendChild(offlineNotification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      offlineNotification.remove();
    }, 3000);
  },
});

const container = document.getElementById('root');

if (container) {
  const root = createRoot(container);
  
  // App loading spinner
  const LoadingSpinner = () => (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );

  // Render app with suspense
  root.render(
    <StrictMode>
      <Suspense fallback={<LoadingSpinner />}>
        <App />
      </Suspense>
    </StrictMode>
  );
  
  // Mark the end of initialization for performance measurement
  performance.mark('app-init-end');
  performance.measure('app-initialization', 'app-init-start', 'app-init-end');
}

// Inform developer about performance in development
if (import.meta.env.DEV) {
  const appPerf = performance.getEntriesByName('app-initialization')[0];
  console.log(`App initialization completed in ${appPerf.duration.toFixed(2)}ms`);
  
  // Log additional performance tracking info
  console.log('Performance monitoring active. Open browser DevTools Performance tab for detailed metrics.');
}
