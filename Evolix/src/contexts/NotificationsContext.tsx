import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { createRealtimeSocket } from '../services/realtimeClient';
import { getNotifications, markAllNotificationsRead, type NotificationItem } from '../services/notificationsApi';

type NotificationsContextValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  errorMessage: string;
  refreshNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  acknowledgeNotification: (notificationId: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const refreshNotifications = async () => {
    if (!session?.token) {
      setNotifications([]);
      setErrorMessage('');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      const items = await getNotifications();
      setNotifications(items);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not load notifications.');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.token) {
      setNotifications([]);
      setErrorMessage('');
      setIsLoading(false);
      return;
    }

    void refreshNotifications();

    const socket = createRealtimeSocket();

    if (!socket) {
      return;
    }

    const handleNotificationCreated = (notification: NotificationItem) => {
      setNotifications((current) => [
        notification,
        ...current.filter((item) => item.id !== notification.id),
      ]);
    };

    socket.on('notification.created', handleNotificationCreated);

    return () => {
      socket.off('notification.created', handleNotificationCreated);
      socket.disconnect();
    };
  }, [session?.token]);

  const markAllAsRead = async () => {
    if (!session?.token) {
      return;
    }

    await markAllNotificationsRead();
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
  };

  const acknowledgeNotification = (notificationId: string) => {
    setNotifications((current) => current.map((notification) => (
      notification.id === notificationId ? { ...notification, isRead: true } : notification
    )));
  };

  const unreadCount = notifications.reduce((count, notification) => count + (notification.isRead ? 0 : 1), 0);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      isLoading,
      errorMessage,
      refreshNotifications,
      markAllAsRead,
      acknowledgeNotification,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }

  return context;
}