import React, { useState, useEffect } from 'react';

interface PWAPromptProps {
  className?: string;
}

const PWAPrompt: React.FC<PWAPromptProps> = ({ className = '' }) => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if this is iOS
    const isIOS = 
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    
    setIsIOS(isIOS);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to show install button
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    
    // Hide the install button
    setIsInstallable(false);
    
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
  };

  if (!isInstallable && !isIOS) return null;

  return (
    <div className={`p-4 bg-purple-100 dark:bg-purple-900 rounded-lg shadow-md mb-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-2">Install FinFlow App</h3>
      
      {isIOS ? (
        <div>
          <p className="mb-2">To install this app on your iOS device:</p>
          <ol className="list-decimal pl-5 mb-3">
            <li>Tap the Share button in Safari</li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top-right corner</li>
          </ol>
        </div>
      ) : (
        <div>
          <p className="mb-2">Install this app on your device for quick access anytime, even offline!</p>
          <button 
            onClick={handleInstallClick}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
          >
            Install App
          </button>
        </div>
      )}
    </div>
  );
};

export default PWAPrompt;
