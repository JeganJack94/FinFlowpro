// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.

import React, { useState } from 'react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'signin' | 'signup'>('landing');
  
  const navigateTo = (page: 'landing' | 'signin' | 'signup') => {
    setCurrentPage(page);
  };
  
  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
      {currentPage === 'landing' && <LandingPage navigateTo={navigateTo} />}
      {currentPage === 'signin' && <SignInPage navigateTo={navigateTo} />}
      {currentPage === 'signup' && <SignUpPage navigateTo={navigateTo} />}
    </div>
  );
};

interface NavigationProps {
  navigateTo: (page: 'landing' | 'signin' | 'signup') => void;
}

const LandingPage: React.FC<NavigationProps> = ({ navigateTo }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed w-full top-0 bg-white shadow-sm z-10">
        <div className="flex justify-between items-center px-4 py-3">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <span className="ml-2 font-semibold text-lg">AppName</span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigateTo('signin')}
              className="text-sm text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigateTo('signup')}
              className="text-sm text-white font-medium px-3 py-1.5 bg-purple-700 rounded-lg hover:bg-purple-800 transition shadow-sm cursor-pointer !rounded-button"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Main Content with padding for fixed header */}
      <main className="flex-grow pt-16">
        {/* Hero Section */}
        <section className="px-4 py-10">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">
              Simplify Your Digital Experience
            </h1>
            <p className="text-gray-600 mb-6 max-w-xs">
              The all-in-one platform that helps you organize, collaborate, and achieve more in less time.
            </p>
            <button 
              onClick={() => navigateTo('signup')}
              className="bg-purple-700 text-white font-medium px-6 py-3 rounded-lg shadow-md hover:bg-purple-800 transition transform hover:scale-105 mb-8 cursor-pointer !rounded-button"
            >
              Get Started — It's Free
            </button>
            
            <div className="w-full max-w-xs h-64 rounded-xl overflow-hidden shadow-lg mb-6">
              <img 
                src="https://readdy.ai/api/search-image?query=Modern%20app%20interface%20dashboard%20with%20purple%20accent%20colors%2C%20clean%20design%2C%20data%20visualization%2C%20productivity%20tools%2C%20organized%20layout%2C%20professional%20UI%2C%20high%20quality%20render%2C%20centered%20composition%2C%20soft%20lighting%2C%20digital%20workspace&width=375&height=256&seq=1&orientation=landscape" 
                alt="App Interface Preview" 
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-8 bg-white">
          <h2 className="text-2xl font-semibold text-center mb-8">Why Choose Us</h2>
          <div className="grid grid-cols-1 gap-6">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <i className="fas fa-bolt text-purple-700 text-xl"></i>
              </div>
              <h3 className="font-semibold text-lg mb-2">Lightning Fast</h3>
              <p className="text-gray-600 text-sm">
                Experience unparalleled speed with our optimized platform that loads in milliseconds.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <i className="fas fa-shield-alt text-purple-700 text-xl"></i>
              </div>
              <h3 className="font-semibold text-lg mb-2">Bank-Level Security</h3>
              <p className="text-gray-600 text-sm">
                Your data is protected with enterprise-grade encryption and advanced security protocols.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <i className="fas fa-sync text-purple-700 text-xl"></i>
              </div>
              <h3 className="font-semibold text-lg mb-2">Seamless Integration</h3>
              <p className="text-gray-600 text-sm">
                Connect with your favorite tools and services for a unified workflow experience.
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="px-4 py-10 bg-gray-50">
          <h2 className="text-2xl font-semibold text-center mb-8">What Our Users Say</h2>
          
          {/* Testimonial Card */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center mr-3">
                <span className="text-purple-700 font-medium">JD</span>
              </div>
              <div>
                <h4 className="font-medium">James Davidson</h4>
                <p className="text-sm text-gray-500">Marketing Director</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm italic">
              "This app has transformed how our team collaborates. We've seen a 40% increase in productivity since implementing it."
            </p>
            <div className="mt-3 flex">
              <i className="fas fa-star text-yellow-400"></i>
              <i className="fas fa-star text-yellow-400"></i>
              <i className="fas fa-star text-yellow-400"></i>
              <i className="fas fa-star text-yellow-400"></i>
              <i className="fas fa-star text-yellow-400"></i>
            </div>
          </div>
          
          {/* Testimonial Card */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center mr-3">
                <span className="text-purple-700 font-medium">SR</span>
              </div>
              <div>
                <h4 className="font-medium">Sarah Reynolds</h4>
                <p className="text-sm text-gray-500">Freelance Designer</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm italic">
              "The intuitive interface and powerful features have made managing my client projects so much easier. Highly recommended!"
            </p>
            <div className="mt-3 flex">
              <i className="fas fa-star text-yellow-400"></i>
              <i className="fas fa-star text-yellow-400"></i>
              <i className="fas fa-star text-yellow-400"></i>
              <i className="fas fa-star text-yellow-400"></i>
              <i className="fas fa-star-half-alt text-yellow-400"></i>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="px-4 py-8 bg-white">
          <p className="text-center text-sm text-gray-500 mb-6">Trusted by companies worldwide</p>
          <div className="flex justify-around items-center">
            <div className="text-gray-400 font-semibold">ACME Inc.</div>
            <div className="text-gray-400 font-semibold">GlobalTech</div>
            <div className="text-gray-400 font-semibold">FutureX</div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 px-4 mt-auto">
        <div className="text-center text-sm text-gray-500">
          <p>© 2025 AppName. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-3">
            <a href="#" className="hover:text-purple-700 transition cursor-pointer">Terms</a>
            <a href="#" className="hover:text-purple-700 transition cursor-pointer">Privacy</a>
            <a href="#" className="hover:text-purple-700 transition cursor-pointer">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const SignInPage: React.FC<NavigationProps> = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Handle sign in logic
    }, 1500);
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
              <span className="text-white font-bold">A</span>
            </div>
            <span className="ml-2 font-semibold text-lg">AppName</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-xl shadow-md p-6 mt-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
              <p className="text-gray-600 text-sm mt-1">Sign in to continue to your account</p>
            </div>

            <form onSubmit={handleSignIn}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  placeholder="you@example.com"
                  required
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    placeholder="••••••••"
                    required
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

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer !rounded-button"
                >
                  <i className="fab fa-google"></i>
                </button>
                <button
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer !rounded-button"
                >
                  <i className="fab fa-apple"></i>
                </button>
                <button
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer !rounded-button"
                >
                  <i className="fab fa-facebook-f"></i>
                </button>
              </div>
            </div>
          </div>

          <p className="text-center mt-6 text-sm text-gray-600">
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

const SignUpPage: React.FC<NavigationProps> = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 2;

  const handleNextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Handle sign up logic
    }, 1500);
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
              <span className="text-white font-bold">A</span>
            </div>
            <span className="ml-2 font-semibold text-lg">AppName</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 pt-16">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-xl shadow-md p-6 mt-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
              <p className="text-gray-600 text-sm mt-1">Join thousands of users today</p>
            </div>

            {/* Progress Indicator */}
            <div className="flex justify-between mb-6">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div key={index} className="flex-1 flex items-center">
                  <div 
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      index + 1 === step 
                        ? 'bg-purple-700 text-white' 
                        : index + 1 < step 
                          ? 'bg-purple-200 text-purple-700' 
                          : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index + 1 < step ? (
                      <i className="fas fa-check text-xs"></i>
                    ) : (
                      <span className="text-xs">{index + 1}</span>
                    )}
                  </div>
                  {index < totalSteps - 1 && (
                    <div 
                      className={`flex-1 h-1 ${
                        index + 1 < step ? 'bg-purple-200' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleSignUp}>
              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="first-name" className="block text-sm font-medium text-gray-700 mb-1">
                        First name
                      </label>
                      <input
                        id="first-name"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="last-name" className="block text-sm font-medium text-gray-700 mb-1">
                        Last name
                      </label>
                      <input
                        id="last-name"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 cursor-pointer !rounded-button"
                  >
                    Continue
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-400`}></i>
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Password must be at least 8 characters long with a number and a special character.
                    </p>
                  </div>

                  <div className="flex items-center mb-6">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={() => setAgreeTerms(!agreeTerms)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      required
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                      I agree to the <a href="#" className="text-purple-700 hover:text-purple-800">Terms of Service</a> and <a href="#" className="text-purple-700 hover:text-purple-800">Privacy Policy</a>
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 cursor-pointer !rounded-button"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !agreeTerms}
                      className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer !rounded-button"
                    >
                      {isLoading ? (
                        <i className="fas fa-circle-notch fa-spin"></i>
                      ) : (
                        "Sign up"
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer !rounded-button"
                >
                  <i className="fab fa-google"></i>
                </button>
                <button
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer !rounded-button"
                >
                  <i className="fab fa-apple"></i>
                </button>
                <button
                  type="button"
                  className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 cursor-pointer !rounded-button"
                >
                  <i className="fab fa-facebook-f"></i>
                </button>
              </div>
            </div>
          </div>

          <p className="text-center mt-6 text-sm text-gray-600">
            Already have an account?{" "}
            <span 
              className="font-medium text-purple-700 hover:text-purple-800 cursor-pointer"
              onClick={() => navigateTo('signin')}
            >
              Sign in
            </span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;

