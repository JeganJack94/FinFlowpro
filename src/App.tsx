import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from 'react';
import SignUp from "./pages/auth/SignUpPage";
import SignIn from "./pages/auth/SignInPage";
import LandingPage from "./pages/auth/LandingPage";
import Home from "./pages/Home";
import Analytics from "./pages/Analytics";
import Goals from "./pages/Goals";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FinanceProvider } from "./contexts/FinanceContext";
import { NotificationProvider } from "./components/NotificationProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Navigation from "./components/Navigation";
import './styles/index.css'; // Import your global CSS file

// Initialize dark mode from localStorage or system preference on page load
function initializeDarkMode() {
  // Get the saved preference from localStorage, or use system preference
  const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedDarkMode = localStorage.getItem('darkMode');
  const shouldUseDarkMode = savedDarkMode === null ? prefersDarkMode : savedDarkMode === 'true';
  
  // Apply the dark mode class to the HTML element
  if (shouldUseDarkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Component to handle redirects based on auth state
function AuthRedirect() {
  const { currentUser } = useAuth();
  const location = useLocation();
  
  // If user is authenticated and trying to access auth pages, redirect to home
  if (currentUser && ['/signin', '/signup', '/'].includes(location.pathname)) {
    return <Navigate to="/home" replace />;
  }
  
  return null;
}

function AppRoutes() {
  const navigate = useNavigate();
  const navigateTo = (page: 'landing' | 'signin' | 'signup') => {
    if (page === 'landing') navigate('/');
    if (page === 'signin') navigate('/signin');
    if (page === 'signup') navigate('/signup');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      <AuthRedirect />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage navigateTo={navigateTo} />} />
        <Route path="/signup" element={<SignUp navigateTo={navigateTo} />} />
        <Route path="/signin" element={<SignIn navigateTo={navigateTo} />} />
        
        {/* Protected routes */}
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        } />
        <Route path="/goals" element={
          <ProtectedRoute>
            <Goals />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  // Initialize dark mode before react hydration to prevent flicker
  useEffect(() => {
    initializeDarkMode();
  }, []);

  // Add offline status detection
  const [isOffline, setIsOffline] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <FinanceProvider>
          <NotificationProvider>
            {isOffline && (
              <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white p-2 text-center z-50">
                You are currently offline. Some features may be limited.
              </div>
            )}
            <AppRoutes />
            <Navigation />
          </NotificationProvider>
        </FinanceProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;