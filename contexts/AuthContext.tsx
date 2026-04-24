import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: number;
  phone: string;
  fullName: string;
  isVerified: boolean;
  isAdmin: boolean;
  welcomeBonusClaimed: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  updateUser: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const data = await api.auth.me();
      if (data && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.log('No active session found.');
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.log('Logout API failed, clearing local state anyway');
    }
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  const refreshUser = async () => {
    await checkSession();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
