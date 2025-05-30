import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';

interface NavigationProps {
  navigateTo: (page: 'landing' | 'signin' | 'signup') => void;
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

const SignInPage: React.FC<NavigationProps> = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect or show success (e.g., navigateTo('landing') or dashboard)
      navigateTo('landing');
    } catch (error: unknown) {
      let message = 'An unknown error occurred.';
      if (error instanceof Error) {
        message = error.message;
      } else if (isErrorWithMessage(error)) {
        message = error.message;
      }
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="fixed w-full top-0 bg-white shadow-sm z-10">
        <div className="flex justify-between items-center px-4 py-3">
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => navigateTo('landing')}
          >
            <div className="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">Fin</span>
            </div>
            <span className="ml-2 font-semibold text-lg">FinFlow</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-sm flex flex-col justify-center items-center min-h-[calc(100vh-4rem)]">
          <div className="bg-white rounded-xl shadow-md p-8 w-full flex flex-col justify-center items-center">
            <div className="text-center mb-6 w-full">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-gray-600 text-sm mt-1">Sign in to continue to your account</p>
            </div>
            <form onSubmit={handleSignIn} className="w-full">
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-white appearance-none"
                  placeholder="you@example.com"
                  required
                  autoComplete="username"
                />
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <a href="#" className="text-xs text-purple-700 hover:text-purple-800 cursor-pointer">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white text-gray-900 dark:bg-gray-700 dark:text-white appearance-none"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-400`}></i>
                  </button>
                </div>
              </div>

              <div className="flex items-center mb-6">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 cursor-pointer !rounded-button"
              >
                {isLoading ? (
                  <i className="fas fa-circle-notch fa-spin"></i>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div> 

          <p className="text-center mt-6 text-sm text-gray-600 w-full">
            Don't have an account?{" "}
            <span 
              className="font-medium text-purple-700 hover:text-purple-800 cursor-pointer"
              onClick={() => navigateTo('signup')}
            >
              Sign up
            </span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default SignInPage;
