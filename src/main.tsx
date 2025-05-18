import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { registerSW } from 'virtual:pwa-register';

// Initialize dark mode immediately before rendering to prevent flash
const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const savedDarkMode = localStorage.getItem('darkMode');
const shouldUseDarkMode = savedDarkMode === null ? prefersDarkMode : savedDarkMode === 'true';

if (shouldUseDarkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Register service worker with auto-update
const updateSW = registerSW({
  onNeedRefresh() {
    // Show refresh prompt to the user
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
