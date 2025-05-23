import React, { createContext, useContext, useCallback } from 'react';

interface NotificationProviderProps {
  children: React.ReactNode;
}

interface NotificationContextType {
  sendPushNotification: (title: string, body: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // This uses the browser Notification API
  const sendPushNotification = useCallback((title: string, body: string) => {
    if (window.Notification && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (window.Notification && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  }, []);

  return (
    <NotificationContext.Provider value={{ sendPushNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};
