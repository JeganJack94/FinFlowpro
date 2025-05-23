import React from 'react';

interface UserManualModalProps {
  showModal: boolean;
  onClose: () => void;
}

const UserManualModal: React.FC<UserManualModalProps> = ({ showModal, onClose }) => {
  if (!showModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl p-5 relative max-h-[90vh] overflow-y-auto">
        <button 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          onClick={onClose}
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white border-b pb-3 dark:border-gray-700">Finflow App User Manual</h2>
        
        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          <section>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">1. What is Finflow?</h3>
            <p className="mb-2">
              Finflow is a mobile-first Progressive Web App (PWA) designed to help you track your income, expenses, liabilities, and savings. It features real-time syncing, offline access, and secure authentication.
            </p>
            <p className="text-purple-500">
              <strong>Access Finflow:</strong> <a href="https://fin-flowai.vercel.app/" target="_blank" rel="noreferrer" className="hover:underline">https://fin-flowai.vercel.app/</a>
            </p>
          </section>
          
          <section>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">2. Key Features</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Mobile-First Design:</strong> Optimized for smartphones and tablets.</li>
              <li><strong>PWA:</strong> Installable on your device for an app-like experience.</li>
              <li><strong>Real-Time Sync:</strong> All your data is instantly updated across devices.</li>
              <li><strong>Offline Capability:</strong> Access and update your finances even without internet.</li>
              <li><strong>Secure Authentication:</strong> Sign up and sign in with confidence using Firebase Auth.</li>
            </ul>
          </section>
          
          <section>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">3. Getting Started</h3>
            
            <h4 className="text-lg font-medium mt-3 mb-2 text-gray-800 dark:text-white">3.1. Accessing Finflow</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Open your browser (Chrome, Safari, Edge, etc.) on your mobile or desktop device.</li>
              <li>Go to <a href="https://fin-flowai.vercel.app/" target="_blank" rel="noreferrer" className="text-purple-500 hover:underline">https://fin-flowai.vercel.app/</a></li>
            </ol>
            
            <h4 className="text-lg font-medium mt-3 mb-2 text-gray-800 dark:text-white">3.2. Creating an Account</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Tap <strong>Sign Up</strong> on the landing page.</li>
              <li>Enter your email and create a password.</li>
              <li>Follow the prompts to complete registration.</li>
            </ol>
            
            <h4 className="text-lg font-medium mt-3 mb-2 text-gray-800 dark:text-white">3.3. Signing In</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Tap <strong>Sign In</strong>.</li>
              <li>Enter your registered email and password.</li>
              <li>Tap <strong>Sign In</strong> to access your dashboard.</li>
            </ol>
          </section>
          
          <section>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">4. Installing Finflow as a PWA</h3>
            
            <h4 className="text-lg font-medium mt-3 mb-2 text-gray-800 dark:text-white">4.1. On Android (Chrome)</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Open <a href="https://fin-flowai.vercel.app/" target="_blank" rel="noreferrer" className="text-purple-500 hover:underline">https://fin-flowai.vercel.app/</a> in Chrome.</li>
              <li>Tap the three-dot menu in the top-right corner.</li>
              <li>Select <strong>Add to Home screen</strong>.</li>
              <li>Confirm by tapping <strong>Add</strong>.</li>
              <li>Finflow will appear on your home screen like a native app.</li>
            </ol>
            
            <h4 className="text-lg font-medium mt-3 mb-2 text-gray-800 dark:text-white">4.2. On iOS (Safari)</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Open <a href="https://fin-flowai.vercel.app/" target="_blank" rel="noreferrer" className="text-purple-500 hover:underline">https://fin-flowai.vercel.app/</a> in Safari.</li>
              <li>Tap the <strong>Share</strong> icon (square with arrow).</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> in the top-right corner.</li>
              <li>Finflow will be installed on your home screen.</li>
            </ol>
          </section>
          
          <section>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">5. Using Finflow</h3>
            
            <h4 className="text-lg font-medium mt-3 mb-2 text-gray-800 dark:text-white">5.1. Dashboard Overview</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Home:</strong> View your financial summary and recent activity.</li>
              <li><strong>Analytics:</strong> Visualize your income, expenses, and trends.</li>
              <li><strong>Goals:</strong> Set and track savings or spending goals.</li>
              <li><strong>Notifications:</strong> Get reminders and important updates.</li>
              <li><strong>Profile:</strong> Manage your account and preferences.</li>
            </ul>
            
            <h4 className="text-lg font-medium mt-3 mb-2 text-gray-800 dark:text-white">5.2. Adding Transactions</h4>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Go to the <strong>Home</strong> or <strong>Analytics</strong> page.</li>
              <li>Tap <strong>Add Transaction</strong> (usually a + button).</li>
              <li>Enter details: amount, category, date, and notes.</li>
              <li>Save to update your records instantly.</li>
            </ol>
          </section>
          
          <section>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">6. Security & Privacy</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>All authentication is handled securely via Firebase Auth.</li>
              <li>Your data is stored in Google Firestore and is accessible only to you.</li>
            </ul>
          </section>
          
          <section>
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-white">7. Support</h3>
            <p>
              For help or feedback, contact the Finflow team via the app's support section or email 
              <a href="mailto:support@finflow.com" className="text-purple-500 hover:underline ml-1">support@finflow.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserManualModal;