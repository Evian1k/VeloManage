import React, { createContext, useContext, useState, useEffect } from 'react';
import { userStorage, initializeStorage } from '@/utils/storage';
import { sendRegistrationNotification, sendWelcomeSMS } from '@/utils/smsService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const ADMIN_USERS = {
  'emmanuel.evian@autocare.com': {
    password: 'autocarpro12k@12k.wwc',
    name: 'Emmanuel Evian',
    role: 'Main Admin',
    id: 'admin-001'
  },
  'ibrahim.mohamud@autocare.com': {
    password: 'autocarpro12k@12k.wwc',
    name: 'Ibrahim Mohamud',
    role: 'Admin',
    id: 'admin-002'
  },
  'joel.nganga@autocare.com': {
    password: 'autocarpro12k@12k.wwc',
    name: 'Joel Ng\'ang\'a',
    role: 'Admin',
    id: 'admin-003'
  },
  'patience.karanja@autocare.com': {
    password: 'autocarpro12k@12k.wwc',
    name: 'Patience Karanja',
    role: 'Admin',
    id: 'admin-004'
  },
  'joyrose.kinuthia@autocare.com': {
    password: 'autocarpro12k@12k.wwc',
    name: 'Joyrose Kinuthia',
    role: 'Admin',
    id: 'admin-005'
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize storage system
    initializeStorage();
    
    // Load saved user
    const savedUser = userStorage.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if this is an admin user
    const adminUser = ADMIN_USERS[email.toLowerCase()];
    
    if (adminUser) {
      // Validate admin password
      if (password !== adminUser.password) {
        throw new Error('Invalid admin credentials');
      }
      
      const userData = {
        id: adminUser.id,
        email: email.toLowerCase(),
        name: adminUser.name,
        role: adminUser.role,
        isAdmin: true,
        joinDate: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      
      setUser(userData);
      userStorage.saveCurrentUser(userData);
      return userData;
    } else {
      // Check if user already exists (by email or phone)
      const allUsers = userStorage.getAllUsers();
      const existingUser = Object.values(allUsers).find(u => 
        u.email.toLowerCase() === email.toLowerCase() || 
        u.phone === email // Allow login with phone number
      );
      
      if (existingUser) {
        // User exists, log them in with existing data
        const userData = {
          ...existingUser,
          lastLogin: new Date().toISOString()
        };
        
        setUser(userData);
        userStorage.saveCurrentUser(userData);
        return userData;
      } else {
        // New user - should register first
        throw new Error('User not found. Please register first.');
      }
    }
  };

  const register = async (userData) => {
    try {
      console.log('Starting registration for:', userData.email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validate required fields
      console.log('Validating required fields...');
      if (!userData.name || !userData.email || !userData.password) {
        throw new Error('Please fill in all required fields.');
      }
      
      // Check if user already exists
      console.log('Checking for existing users...');
      const allUsers = userStorage.getAllUsers();
      console.log('All users:', Object.keys(allUsers));
      
      const existingUser = Object.values(allUsers).find(u => 
        u.email.toLowerCase() === userData.email.toLowerCase() ||
        (userData.phone && u.phone === userData.phone)
      );
      
      if (existingUser) {
        throw new Error('User already exists with this email or phone. Please login instead.');
      }
      
      console.log('Creating new user...');
      const newUser = {
        id: Date.now(),
        ...userData,
        email: userData.email.toLowerCase(),
        isAdmin: Object.keys(ADMIN_USERS).includes(userData.email.toLowerCase()),
        joinDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        vehicleCount: 1,
        lastService: null
      };
      
      console.log('New user created:', newUser);
      
      console.log('Setting user state...');
      setUser(newUser);
      
      console.log('Saving user to storage...');
      const saveResult = userStorage.saveCurrentUser(newUser);
      console.log('Save result:', saveResult);
      
      // Send SMS notifications (don't fail registration if SMS fails)
      try {
        console.log('Sending SMS notifications...');
        await Promise.all([
          sendRegistrationNotification(newUser),
          sendWelcomeSMS(newUser)
        ]);
        console.log('SMS notifications sent successfully');
      } catch (smsError) {
        // Log SMS error but don't fail registration
        console.warn('SMS notification failed:', smsError);
      }
      
      console.log('Registration completed successfully');
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    userStorage.clearCurrentUser();
  };

  const updateUser = (updatedData) => {
    if (user) {
      const newUserData = { ...user, ...updatedData };
      setUser(newUserData);
      userStorage.saveCurrentUser(newUserData);
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