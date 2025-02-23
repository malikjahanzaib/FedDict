import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyAuth, setAuthCredentials, clearAuthCredentials } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for credentials on mount
    const storedCredentials = localStorage.getItem('authCredentials');
    if (storedCredentials) {
      setAuthCredentials(storedCredentials);
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const isValid = await verifyAuth();
      setIsAuthenticated(isValid);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const credentials = btoa(`${username}:${password}`);
    setAuthCredentials(credentials);
    localStorage.setItem('authCredentials', credentials);
    const isValid = await verifyAuth();
    setIsAuthenticated(isValid);
    return isValid;
  };

  const logout = () => {
    clearAuthCredentials();
    localStorage.removeItem('authCredentials');
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 