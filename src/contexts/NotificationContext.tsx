import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Context interface
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

// Create context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New student enrolled',
      message: 'John Doe completed face enrollment',
      type: 'success',
      timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      read: false,
    },
    {
      id: '2',
      title: 'Attendance marked',
      message: '85% attendance for CS-301',
      type: 'info',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
    },
    {
      id: '3',
      title: 'System update',
      message: 'Face recognition accuracy improved',
      type: 'info',
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Don't show toast notifications automatically - they'll be shown in notification bar
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (type === 'error') {
      toast.error(message);
    } else if (type === 'success') {
      toast.success(message);
    } else {
      toast(message);
    }
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    showToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notification context
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Helper functions for common notification types
export const notificationHelpers = {
  success: (title: string, message: string) => ({
    title,
    message,
    type: 'success' as const,
  }),
  
  error: (title: string, message: string) => ({
    title,
    message,
    type: 'error' as const,
  }),
  
  info: (title: string, message: string) => ({
    title,
    message,
    type: 'info' as const,
  }),
  
  warning: (title: string, message: string) => ({
    title,
    message,
    type: 'warning' as const,
  }),
};

export default NotificationContext;
