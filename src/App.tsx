import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { FinanceProvider } from "./contexts/FinanceContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navigation from "./components/Navigation";
import './styles/App.css'; // Import your global CSS file
import performanceMonitor from './utils/performanceMonitor';

// Lazy load all page components for code splitting
const SignUp = lazy(() => import("./pages/auth/SignUpPage"));
const SignIn = lazy(() => import("./pages/auth/SignInPage"));
const LandingPage = lazy(() => import("./pages/auth/LandingPage"));
const Home = lazy(() => import("./pages/Home"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Goals = lazy(() => import("./pages/Goals"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const FinanceTracker = lazy(() => import("./pages/Finance-Tracker-Dashboard-Optimized"));

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

// Loading spinner component for route transitions
const RouteLoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen w-full">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

function AppRoutes() {
  const navigate = useNavigate();
  const navigateTo = (page: 'landing' | 'signin' | 'signup') => {
    if (page === 'landing') navigate('/');
    if (page === 'signin') navigate('/signin');
    if (page === 'signup') navigate('/signup');
  };
  
  // Add performance measurement for route changes
  const location = useLocation();
  useEffect(() => {
    // Create performance markers for navigation
    performance.mark(`route-change-to-${location.pathname}`);
  }, [location]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-200">
      <AuthRedirect />
      <Suspense fallback={<RouteLoadingSpinner />}>
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
          
          {/* Add optimized finance tracker dashboard */}
          <Route path="/finance-tracker" element={
            <ProtectedRoute>
              <FinanceTracker />
            </ProtectedRoute>
          } />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
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
          {isOffline && (
            <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white p-2 text-center z-50">
              You are currently offline. Some features may be limited.
            </div>
          )}
          <AppRoutes />
          <Navigation />
        </FinanceProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;