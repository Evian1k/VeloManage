import React, { createContext, useContext, useState, useEffect } from 'react';
import storage from '@/lib/storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const ADMIN_USERS = [
  'emmanuel.evian@autocare.com',
  'joel.nganga@autocare.com',
  'ibrahim.mohamud@autocare.com',
  'patience.karanjah@autocare.com'
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = storage.getUserData();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const userData = {
      id: email === 'admin@autocare.com' ? 0 : Date.now(),
      email,
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      isAdmin: ADMIN_USERS.includes(email) || email === 'admin@autocare.com',
      joinDate: new Date().toISOString(),
      vehicleCount: Math.floor(Math.random() * 3) + 1,
      lastService: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    setUser(userData);
    storage.setUserData(userData);
    return userData;
  };

  const register = async (userData) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newUser = {
      id: Date.now(),
      ...userData,
      isAdmin: ADMIN_USERS.includes(userData.email),
      joinDate: new Date().toISOString(),
      vehicleCount: 1,
      lastService: null
    };
    
    setUser(newUser);
    storage.setUserData(newUser);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    storage.set('autocare_user', null);
  };

  const updateUser = (updatedData) => {
    if (user) {
      const newUserData = { ...user, ...updatedData };
      setUser(newUserData);
      storage.setUserData(newUserData);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};