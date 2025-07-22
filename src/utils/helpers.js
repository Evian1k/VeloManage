import { SERVICE_STATUS, PRIORITY_LEVELS, DATE_FORMATS } from './constants.js';

/**
 * Formats a date string to a readable format
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type (default: 'DISPLAY')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, format = 'DISPLAY') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const options = {
    DISPLAY: { year: 'numeric', month: 'short', day: 'numeric' },
    DATETIME: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    },
    TIME: { hour: '2-digit', minute: '2-digit' }
  };
  
  return dateObj.toLocaleDateString('en-US', options[format] || options.DISPLAY);
};

/**
 * Calculates the time difference between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date (default: now)
 * @returns {string} - Human readable time difference
 */
export const getTimeDifference = (startDate, endDate = new Date()) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.abs(end - start);
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

/**
 * Generates a unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} - Unique ID
 */
export const generateId = (prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
};

/**
 * Gets the status badge color class
 * @param {string} status - Service status
 * @returns {string} - CSS class for status badge
 */
export const getStatusColor = (status) => {
  const colors = {
    [SERVICE_STATUS.PENDING]: 'bg-yellow-500',
    [SERVICE_STATUS.APPROVED]: 'bg-blue-500',
    [SERVICE_STATUS.IN_PROGRESS]: 'bg-orange-500',
    [SERVICE_STATUS.COMPLETED]: 'bg-green-500',
    [SERVICE_STATUS.REJECTED]: 'bg-red-500',
    [SERVICE_STATUS.CANCELLED]: 'bg-gray-500'
  };
  
  return colors[status] || 'bg-gray-500';
};

/**
 * Gets the priority badge color class
 * @param {string} priority - Priority level
 * @returns {string} - CSS class for priority badge
 */
export const getPriorityColor = (priority) => {
  const colors = {
    [PRIORITY_LEVELS.LOW]: 'bg-gray-500',
    [PRIORITY_LEVELS.NORMAL]: 'bg-blue-500',
    [PRIORITY_LEVELS.HIGH]: 'bg-orange-500',
    [PRIORITY_LEVELS.URGENT]: 'bg-red-500'
  };
  
  return colors[priority] || 'bg-blue-500';
};

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncates a string to a specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} - Truncated string
 */
export const truncateText = (str, length = 100, suffix = '...') => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length).trim() + suffix;
};

/**
 * Formats a number as currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (typeof amount !== 'number') return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttles a function call
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Checks if an object is empty
 * @param {object} obj - Object to check
 * @returns {boolean} - True if empty
 */
export const isEmpty = (obj) => {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
};

/**
 * Deep clones an object
 * @param {any} obj - Object to clone
 * @returns {any} - Cloned object
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Filters an array of objects by a search term
 * @param {Array} items - Items to filter
 * @param {string} searchTerm - Search term
 * @param {Array} searchFields - Fields to search in
 * @returns {Array} - Filtered items
 */
export const filterBySearch = (items, searchTerm, searchFields = []) => {
  if (!searchTerm || !items || !Array.isArray(items)) return items;
  
  const lowercaseSearch = searchTerm.toLowerCase();
  
  return items.filter(item => {
    if (searchFields.length === 0) {
      // Search in all string fields
      return Object.values(item).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Search in specified fields
    return searchFields.some(field => {
      const value = item[field];
      return typeof value === 'string' && value.toLowerCase().includes(lowercaseSearch);
    });
  });
};

/**
 * Sorts an array of objects by a field
 * @param {Array} items - Items to sort
 * @param {string} field - Field to sort by
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} - Sorted items
 */
export const sortByField = (items, field, direction = 'asc') => {
  if (!items || !Array.isArray(items)) return items;
  
  return [...items].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    
    if (aValue === bValue) return 0;
    
    let comparison = 0;
    if (aValue > bValue) comparison = 1;
    if (aValue < bValue) comparison = -1;
    
    return direction === 'desc' ? comparison * -1 : comparison;
  });
};

/**
 * Groups an array of objects by a field
 * @param {Array} items - Items to group
 * @param {string} field - Field to group by
 * @returns {Object} - Grouped items
 */
export const groupByField = (items, field) => {
  if (!items || !Array.isArray(items)) return {};
  
  return items.reduce((groups, item) => {
    const key = item[field];
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
};

/**
 * Calculates percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @param {number} decimals - Number of decimal places
 * @returns {number} - Percentage
 */
export const calculatePercentage = (value, total, decimals = 1) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Generates a random color in hex format
 * @returns {string} - Random hex color
 */
export const generateRandomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * Checks if a value is a valid URL
 * @param {string} string - String to validate
 * @returns {boolean} - True if valid URL
 */
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Converts file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Human readable file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Extracts initials from a name
 * @param {string} name - Full name
 * @returns {string} - Initials
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

/**
 * Generates a lorem ipsum text
 * @param {number} words - Number of words
 * @returns {string} - Lorem ipsum text
 */
export const generateLoremIpsum = (words = 10) => {
  const loremWords = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
    'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
    'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
    'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
  ];
  
  const selectedWords = [];
  for (let i = 0; i < words; i++) {
    selectedWords.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
  }
  
  return selectedWords.join(' ') + '.';
};