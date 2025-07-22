import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const savedUser = localStorage.getItem('autocare_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
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
      localStorage.setItem('autocare_user', JSON.stringify(userData));
      return userData;
    } else {
      // Regular user login (any email/password combination)
      const userData = {
        id: Date.now(),
        email: email.toLowerCase(),
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        isAdmin: false,
        joinDate: new Date().toISOString(),
        vehicleCount: Math.floor(Math.random() * 3) + 1,
        lastService: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      setUser(userData);
      localStorage.setItem('autocare_user', JSON.stringify(userData));
      return userData;
    }
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
    localStorage.setItem('autocare_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('autocare_user');
  };

  const updateUser = (updatedData) => {
    if (user) {
      const newUserData = { ...user, ...updatedData };
      setUser(newUserData);
      localStorage.setItem('autocare_user', JSON.stringify(newUserData));
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