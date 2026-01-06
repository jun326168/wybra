import React, { createContext, useContext, useState, useEffect } from 'react'
import { getUser, signOut as apiSignOut } from '@/lib/api';
import { User } from '@/lib/types';

interface AppContextType {
  user: User | null | undefined;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AppContext = createContext<AppContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  signOut: async () => {},
  setUser: () => {},
});

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {

  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  const fetchUser = React.useCallback(async () => {
    try {
      const fetchedUser = await getUser();
      setUser(fetchedUser);
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUser = React.useCallback(async () => {
    try {
      const fetchedUser = await getUser();
      setUser(fetchedUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      await apiSignOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);
  
  useEffect(() => {
    setTimeout(() => {
      fetchUser();
    }, 1000);
  }, [fetchUser]);

  return (
    <AppContext.Provider value={{ 
      user, 
      loading, 
      refreshUser, 
      signOut, 
      setUser 
    }}>
      {children}
    </AppContext.Provider>
  );
};