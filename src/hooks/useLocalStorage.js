import { useState, useEffect } from 'react';

/**
 * Custom hook for managing localStorage with automatic state synchronization
 * @param {string} key - The localStorage key
 * @param {any} initialValue - Initial value if key doesn't exist
 * @returns {Array} - [value, setValue, removeValue]
 */
export const useLocalStorage = (key, initialValue) => {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Remove the item from localStorage
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  };

  // Listen for changes in localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.storageArea === localStorage) {
        try {
          const newValue = e.newValue ? JSON.parse(e.newValue) : initialValue;
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Error parsing localStorage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

/**
 * Hook for managing multiple localStorage keys with a prefix
 * @param {string} prefix - Prefix for all keys
 * @returns {Object} - Storage management functions
 */
export const usePrefixedLocalStorage = (prefix) => {
  const getItem = (key, defaultValue = null) => {
    try {
      const item = window.localStorage.getItem(`${prefix}_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading prefixed localStorage key "${prefix}_${key}":`, error);
      return defaultValue;
    }
  };

  const setItem = (key, value) => {
    try {
      if (value === undefined) {
        window.localStorage.removeItem(`${prefix}_${key}`);
      } else {
        window.localStorage.setItem(`${prefix}_${key}`, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting prefixed localStorage key "${prefix}_${key}":`, error);
    }
  };

  const removeItem = (key) => {
    try {
      window.localStorage.removeItem(`${prefix}_${key}`);
    } catch (error) {
      console.error(`Error removing prefixed localStorage key "${prefix}_${key}":`, error);
    }
  };

  const clearAll = () => {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(`${prefix}_`));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error(`Error clearing prefixed localStorage for prefix "${prefix}":`, error);
    }
  };

  const getAllItems = () => {
    try {
      const items = {};
      const keys = Object.keys(localStorage).filter(key => key.startsWith(`${prefix}_`));
      
      keys.forEach(key => {
        const shortKey = key.replace(`${prefix}_`, '');
        const value = localStorage.getItem(key);
        items[shortKey] = value ? JSON.parse(value) : null;
      });
      
      return items;
    } catch (error) {
      console.error(`Error getting all prefixed localStorage items for prefix "${prefix}":`, error);
      return {};
    }
  };

  return {
    getItem,
    setItem,
    removeItem,
    clearAll,
    getAllItems
  };
};

export default useLocalStorage;