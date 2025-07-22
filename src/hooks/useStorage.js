import { useState, useEffect, useCallback } from 'react';
import storage from '@/lib/storage';

/**
 * Custom hook for enhanced data storage with React integration
 * Provides reactive storage that automatically updates components when data changes
 */
export const useStorage = () => {
  const [storageStats, setStorageStats] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Listen for storage updates
    const handleStorageUpdate = (event) => {
      // Refresh stats when storage is updated
      setStorageStats(storage.getStats());
    };
    
    window.addEventListener('autocareStorageUpdate', handleStorageUpdate);
    window.addEventListener('autocareDataSync', handleStorageUpdate);
    
    // Initial stats load
    setStorageStats(storage.getStats());
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('autocareStorageUpdate', handleStorageUpdate);
      window.removeEventListener('autocareDataSync', handleStorageUpdate);
    };
  }, []);

  // Storage operations with error handling
  const setItem = useCallback((key, data, options = {}) => {
    try {
      const success = storage.set(key, data, options);
      if (success) {
        setStorageStats(storage.getStats());
      }
      return success;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }, []);

  const getItem = useCallback((key, options = {}) => {
    try {
      return storage.get(key, options);
    } catch (error) {
      console.error('Storage get error:', error);
      return options.fallback || null;
    }
  }, []);

  // Specialized storage methods
  const setUserData = useCallback((userData) => {
    const success = setItem('autocare_user', userData);
    return success;
  }, [setItem]);

  const getUserData = useCallback(() => {
    return getItem('autocare_user');
  }, [getItem]);

  const setRequests = useCallback((userId, requests) => {
    return setItem(`autocare_requests_${userId}`, requests);
  }, [setItem]);

  const getRequests = useCallback((userId) => {
    return getItem(`autocare_requests_${userId}`, { fallback: [] });
  }, [getItem]);

  const setVehicles = useCallback((vehicles) => {
    return setItem('autocare_vehicles', vehicles);
  }, [setItem]);

  const getVehicles = useCallback(() => {
    return getItem('autocare_vehicles', { fallback: [] });
  }, [getItem]);

  const setMessages = useCallback((userId, messages) => {
    return setItem(`autocare_messages_${userId}`, messages);
  }, [setItem]);

  const getMessages = useCallback((userId) => {
    return getItem(`autocare_messages_${userId}`, { fallback: [] });
  }, [getItem]);

  const setNotifications = useCallback((userId, notifications) => {
    return setItem(`autocare_notifications_${userId}`, notifications);
  }, [setItem]);

  const getNotifications = useCallback((userId) => {
    return getItem(`autocare_notifications_${userId}`, { fallback: [] });
  }, [getItem]);

  // Backup and recovery operations
  const exportData = useCallback(() => {
    try {
      return storage.exportData();
    } catch (error) {
      console.error('Export error:', error);
      return null;
    }
  }, []);

  const importData = useCallback((backupData) => {
    try {
      const success = storage.importData(backupData);
      if (success) {
        setStorageStats(storage.getStats());
      }
      return success;
    } catch (error) {
      console.error('Import error:', error);
      return false;
    }
  }, []);

  const clearAllData = useCallback(() => {
    try {
      storage.clearAll();
      setStorageStats(storage.getStats());
      return true;
    } catch (error) {
      console.error('Clear data error:', error);
      return false;
    }
  }, []);

  const cleanup = useCallback(() => {
    try {
      storage.cleanup();
      setStorageStats(storage.getStats());
      return true;
    } catch (error) {
      console.error('Cleanup error:', error);
      return false;
    }
  }, []);

  // Utility methods
  const refreshStats = useCallback(() => {
    setStorageStats(storage.getStats());
  }, []);

  const getStorageHealth = useCallback(() => {
    if (!storageStats) return { status: 'unknown', level: 0 };
    
    const usagePercentage = (storageStats.totalSize / (5 * 1024 * 1024)) * 100; // 5MB assumed limit
    
    if (usagePercentage < 50) {
      return { status: 'healthy', level: usagePercentage, color: 'green' };
    } else if (usagePercentage < 80) {
      return { status: 'warning', level: usagePercentage, color: 'yellow' };
    } else {
      return { status: 'critical', level: usagePercentage, color: 'red' };
    }
  }, [storageStats]);

  return {
    // Basic operations
    setItem,
    getItem,
    
    // Specialized operations
    setUserData,
    getUserData,
    setRequests,
    getRequests,
    setVehicles,
    getVehicles,
    setMessages,
    getMessages,
    setNotifications,
    getNotifications,
    
    // Backup & recovery
    exportData,
    importData,
    clearAllData,
    cleanup,
    
    // Statistics & monitoring
    storageStats,
    refreshStats,
    getStorageHealth,
    
    // Status
    isOnline,
    isHealthy: getStorageHealth().status === 'healthy'
  };
};

/**
 * Hook for reactive storage values that automatically update when storage changes
 */
export const useStorageValue = (key, options = {}) => {
  const [value, setValue] = useState(() => storage.get(key, options));
  
  useEffect(() => {
    const handleStorageUpdate = (event) => {
      if (event.detail.key === key) {
        setValue(event.detail.data);
      }
    };
    
    const handleStorageSync = (event) => {
      if (event.detail.key === key) {
        setValue(storage.get(key, options));
      }
    };
    
    window.addEventListener('autocareStorageUpdate', handleStorageUpdate);
    window.addEventListener('autocareDataSync', handleStorageSync);
    
    return () => {
      window.removeEventListener('autocareStorageUpdate', handleStorageUpdate);
      window.removeEventListener('autocareDataSync', handleStorageSync);
    };
  }, [key, options]);

  const updateValue = useCallback((newValue, updateOptions = {}) => {
    const success = storage.set(key, newValue, { ...options, ...updateOptions });
    if (success) {
      setValue(newValue);
    }
    return success;
  }, [key, options]);

  return [value, updateValue];
};

/**
 * Hook for user-specific data with automatic fallbacks
 */
export const useUserStorage = (userId, dataType, fallback = []) => {
  const storageKey = `autocare_${dataType}_${userId}`;
  const [value, setValue] = useStorageValue(storageKey, { fallback });
  
  return [value, setValue];
};

export default useStorage;