import React, { useState, useEffect } from 'react';

interface PWAPromptProps {
  className?: string;
}

const PWAPrompt: React.FC<PWAPromptProps> = ({ className = '' }) => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed or installed
    const hasUserDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (hasUserDismissed === 'true') {
      setInstallDismissed(true);
      return;
    }
    
    // Check if this is iOS
    const isIOS = 
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    
    setIsIOS(isIOS);

    // Check if the app is already installed
    const isAppInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone || 
                          document.referrer.includes('android-app://');
    
    if (isAppInstalled) {
      return; // Don't show prompt if already installed
    }
    
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to show install button
      setIsInstallable(true);
      
      // Only show prompt after user has spent some time in the app (5 seconds)
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    
    // Also check for iOS standalone mode
    if (isIOS && !(window.navigator as any).standalone) {
      // Only show iOS prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        // Log outcome for analytics
        if (outcome === 'accepted') {
          console.log('User accepted the PWA installation');
          // Track this event if you have analytics
          if ('gtag' in window) {
            (window as any).gtag('event', 'pwa_install', {
              'event_category': 'engagement',
              'event_label': 'PWA install accepted'
            });
          }
        } else {
          console.log('User dismissed the PWA installation');
        }
        
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error during PWA installation:', err);
      }
    }
    
    // Hide the install prompt in any case
    setShowPrompt(false);
    setIsInstallable(false);
    
    // Remember that user has seen the prompt
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Function to dismiss the prompt
  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };
  
  // Don't render if the prompt shouldn't be shown
  if (!showPrompt || installDismissed) {
    return null;
  }

  return (
    <div className={`bg-purple-50 dark:bg-gray-800 border border-purple-200 dark:border-gray-700 rounded-xl p-4 shadow-md ${className} animate-fadeIn`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-lg mr-3">
            <i className="fas fa-download text-purple-600 dark:text-purple-400"></i>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 dark:text-white mb-1">Install FinFlow App</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isIOS 
                ? 'Tap the share icon and then "Add to Home Screen"' 
                : 'Install our app for a faster experience with offline access'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center">
          {!isIOS && isInstallable && (
            <button 
              onClick={handleInstallClick}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm mr-2"
              aria-label="Install FinFlow app"
            >
              Install
            </button>
          )}
          
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            aria-label="Dismiss installation prompt"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PWAPrompt;
