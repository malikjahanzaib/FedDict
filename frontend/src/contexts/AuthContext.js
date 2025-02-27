import React, { createContext, useState, useContext, useEffect } from 'react';
import { verifyAuth } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

function useAuth() {
  return useContext(AuthContext);
}

function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on component mount
    const checkAuth = async () => {
      const authCredentials = localStorage.getItem('authCredentials');
      if (authCredentials) {
        try {
          const isValid = await verifyAuth();
          setIsAuthenticated(isValid);
        } catch (error) {
          console.error('Auth verification error:', error);
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('authCredentials');
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
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

export { AuthProvider, useAuth }; 