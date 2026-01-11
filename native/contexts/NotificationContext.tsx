import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { createToken } from '@/lib/api';
import { useAppContext } from './AppContext';

interface NotificationContextType {
  token: string | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  registerToken: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  token: null,
  loading: false,
  error: null,
  requestPermission: async () => false,
  registerToken: async () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAppContext();

  // Configure notification handler
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async (): Promise<Notifications.NotificationBehavior> => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setError('Permission not granted for notifications');
        setLoading(false);
        return false;
      }

      // Get the push token
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID || process.env.EAS_PROJECT_ID;
      const pushToken = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );

      setToken(pushToken.data);
      setLoading(false);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get push token';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  }, []);

  const registerToken = useCallback(async (): Promise<void> => {
    if (!token || !user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createToken(token);
      setLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register token';
      setError(errorMessage);
      setLoading(false);
      console.error('Error registering notification token:', err);
    }
  }, [token, user]);

  // Auto-register token when both token and user are available
  useEffect(() => {
    if (token && user) {
      registerToken();
    }
  }, [token, user, registerToken]);

  return (
    <NotificationContext.Provider
      value={{
        token,
        loading,
        error,
        requestPermission,
        registerToken,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
