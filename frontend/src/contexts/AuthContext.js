import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For development, auto-authenticate
    setUser({
      id: 1,
      username: 'demo_user',
      email: 'demo@example.com',
      role: 'user'
    });
    setIsAuthenticated(true);
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // For development, auto-login
      setUser({
        id: 1,
        username: 'demo_user',
        email: email,
        role: 'user'
      });
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setIsAuthenticated(false);
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      return { success: false, error: error.message };
    }
  };

  const googleLogin = async (credential) => {
    try {
      // For development, auto-login with Google
      setUser({
        id: 1,
        username: 'google_user',
        email: 'google@example.com',
        role: 'user'
      });
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Google login failed:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    googleLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
