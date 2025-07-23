import React, { createContext, useContext, useState, useEffect } from 'react';
import { userStorage, initializeStorage } from '@/utils/storage';
import { sendRegistrationNotification, sendWelcomeSMS } from '@/utils/smsService';
import apiService from '@/utils/api';

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
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    // Check backend availability and load user
    const loadUser = async () => {
      try {
        // Initialize storage system
        initializeStorage();
        
        console.log('🔄 Checking backend availability...');
        const isBackendUp = await apiService.isBackendAvailable();
        setBackendAvailable(isBackendUp);

        if (isBackendUp) {
          console.log('✅ Backend available - Loading user from API');
          try {
            const response = await apiService.getCurrentUser();
            if (response.success && response.data.user) {
              console.log('✅ User loaded from backend:', response.data.user.email);
              setUser(response.data.user);
              return;
            }
          } catch (error) {
            console.log('⚠️ Failed to load user from backend, checking localStorage');
          }
        }

        // Fallback to localStorage
        console.log('📱 Using localStorage mode');
        const savedUser = userStorage.getCurrentUser();
        if (savedUser) {
          console.log('✅ User loaded from localStorage:', savedUser.email);
          setUser(savedUser);
        }
      } catch (error) {
        console.error('❌ Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔑 Starting login for:', email);
      
      // Basic validation
      if (!email || !password) {
        throw new Error('Please enter both email and password.');
      }

      // Try backend first if available
      if (backendAvailable) {
        try {
          console.log('🌐 Using backend login');
          const response = await apiService.login(email, password);
          if (response.success && response.data.user) {
            setUser(response.data.user);
            console.log('✅ Backend login successful');
            return response.data.user;
          }
        } catch (error) {
          console.log('⚠️ Backend login failed, trying localStorage');
        }
      }

      // Fallback to localStorage mode
      console.log('📱 Using localStorage login');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if this is an admin user
      const adminUser = ADMIN_USERS[email.toLowerCase().trim()];
      
      if (adminUser) {
        console.log('👑 Admin login detected');
        
        // Validate admin password
        if (password !== adminUser.password) {
          console.error('❌ Invalid admin password');
          throw new Error('Invalid admin credentials');
        }
        
        const userData = {
          id: adminUser.id,
          email: email.toLowerCase().trim(),
          name: adminUser.name,
          role: adminUser.role,
          isAdmin: true,
          joinDate: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        
        setUser(userData);
        userStorage.saveCurrentUser(userData);
        console.log('✅ Admin login successful');
        return userData;
      } else {
        console.log('👤 Regular user login');
        
        // Get all users
        let allUsers = {};
        try {
          allUsers = userStorage.getAllUsers() || {};
        } catch (error) {
          console.warn('⚠️ Could not retrieve users:', error);
          allUsers = {};
        }
        
        // Check if user exists (by email or phone)
        const existingUser = Object.values(allUsers).find(u => 
          u && u.email && (
            u.email.toLowerCase() === email.toLowerCase().trim() || 
            (u.phone && u.phone === email.trim()) // Allow login with phone number
          )
        );
        
        if (existingUser) {
          console.log('✅ User found, logging in');
          
          // User exists, log them in with existing data
          const userData = {
            ...existingUser,
            lastLogin: new Date().toISOString()
          };
          
          setUser(userData);
          userStorage.saveCurrentUser(userData);
          console.log('✅ User login successful');
          return userData;
        } else {
          console.error('❌ User not found');
          throw new Error('User not found. Please register first.');
        }
      }
    } catch (error) {
      console.error('💥 Login failed:', error.message);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      console.log('🚀 Starting registration for:', userData.email);
      
      // Validate required fields first
      if (!userData.name || !userData.email || !userData.password) {
        console.error('❌ Missing required fields:', { 
          name: !!userData.name, 
          email: !!userData.email, 
          password: !!userData.password 
        });
        throw new Error('Please fill in all required fields.');
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('Please enter a valid email address.');
      }
      
      console.log('✅ Email format validated');

      // Try backend first if available
      if (backendAvailable) {
        try {
          console.log('🌐 Using backend registration');
          const response = await apiService.register(userData);
          if (response.success && response.data.user) {
            setUser(response.data.user);
            console.log('✅ Backend registration successful');
            return response.data.user;
          }
        } catch (error) {
          console.log('⚠️ Backend registration failed, trying localStorage');
          // Don't throw here, fall back to localStorage
        }
      }

      // Fallback to localStorage mode
      console.log('📱 Using localStorage registration');
      
      console.log('✅ Required fields validated');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Initialize storage if needed
      try {
        initializeStorage();
        console.log('✅ Storage initialized');
      } catch (storageError) {
        console.warn('⚠️ Storage initialization warning:', storageError);
      }
      
      // Check if user already exists (by email or phone)
      let allUsers = {};
      try {
        allUsers = userStorage.getAllUsers() || {};
        console.log('✅ Retrieved existing users:', Object.keys(allUsers).length);
      } catch (storageError) {
        console.warn('⚠️ Could not retrieve existing users:', storageError);
        allUsers = {};
      }
      
      const existingUser = Object.values(allUsers).find(u => 
        u && u.email && (
          u.email.toLowerCase() === userData.email.toLowerCase().trim() ||
          (userData.phone && u.phone && u.phone === userData.phone.trim())
        )
      );
      
      if (existingUser) {
        console.error('❌ User already exists:', existingUser.email);
        throw new Error('User already exists with this email or phone. Please login instead.');
      }
      
      console.log('✅ No existing user found, proceeding with registration');
      
      // Create new user
      const newUser = {
        id: Date.now(),
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        phone: userData.phone ? userData.phone.trim() : '',
        isAdmin: Object.keys(ADMIN_USERS).includes(userData.email.toLowerCase().trim()),
        joinDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        vehicleCount: 1,
        lastService: null
      };
      
      console.log('✅ New user object created:', { 
        id: newUser.id, 
        email: newUser.email, 
        isAdmin: newUser.isAdmin 
      });
      
      // Set user in state first
      setUser(newUser);
      console.log('✅ User state updated');
      
      // Save to storage
      try {
        const saveResult = userStorage.saveCurrentUser(newUser);
        console.log('✅ User saved to storage:', saveResult);
      } catch (saveError) {
        console.error('❌ Failed to save user to storage:', saveError);
        // Continue anyway - registration succeeded even if storage fails
      }
      
      // Send SMS notifications (optional - don't fail registration)
      setTimeout(async () => {
        try {
          console.log('📱 Sending SMS notifications...');
          await sendRegistrationNotification(newUser);
          await sendWelcomeSMS(newUser);
          console.log('✅ SMS notifications sent');
        } catch (smsError) {
          console.warn('⚠️ SMS notification failed (non-critical):', smsError);
        }
      }, 100);
      
      console.log('🎉 Registration completed successfully!');
      return newUser;
      
    } catch (error) {
      console.error('💥 Registration failed:', error.message);
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
    updateUser,
    backendAvailable
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};