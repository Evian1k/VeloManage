// Centralized storage utility for AutoCare Pro
// Ensures all data persists when users leave and return to the site

const STORAGE_VERSION = '1.0';
const STORAGE_PREFIX = 'autocare_v1_';

// Storage keys
export const KEYS = {
  // User data
  CURRENT_USER: `${STORAGE_PREFIX}current_user`,
  ALL_USERS: `${STORAGE_PREFIX}all_users`,
  
  // Service requests (global store)
  ALL_REQUESTS: `${STORAGE_PREFIX}all_requests`,
  REQUEST_COUNTER: `${STORAGE_PREFIX}request_counter`,
  
  // Messages (global store)
  ALL_MESSAGES: `${STORAGE_PREFIX}all_messages`,
  MESSAGE_USERS: `${STORAGE_PREFIX}message_users`,
  
  // Trucks and dispatches
  TRUCKS: `${STORAGE_PREFIX}trucks`,
  DISPATCHES: `${STORAGE_PREFIX}dispatches`,
  
  // Notifications
  NOTIFICATIONS: `${STORAGE_PREFIX}notifications`,
  
  // User locations
  USER_LOCATIONS: `${STORAGE_PREFIX}user_locations`,
  
  // System settings
  SYSTEM_SETTINGS: `${STORAGE_PREFIX}system_settings`,
  LAST_BACKUP: `${STORAGE_PREFIX}last_backup`
};

// Safe storage operations with error handling
export const storage = {
  // Get item with fallback
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Storage get error for key ${key}:`, error);
      return defaultValue;
    }
  },

  // Set item with error handling
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Storage set error for key ${key}:`, error);
      return false;
    }
  },

  // Remove item
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Storage remove error for key ${key}:`, error);
      return false;
    }
  },

  // Clear all AutoCare data
  clearAll: () => {
    try {
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(STORAGE_PREFIX)
      );
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  },

  // Check if storage is available
  isAvailable: () => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
};

// User management
export const userStorage = {
  // Save current user
  saveCurrentUser: (user) => {
    if (!user) return false;
    
    // Save to current user
    const success = storage.set(KEYS.CURRENT_USER, user);
    
    // Also save to all users registry
    const allUsers = storage.get(KEYS.ALL_USERS, {});
    allUsers[user.id] = {
      ...user,
      lastSeen: new Date().toISOString()
    };
    storage.set(KEYS.ALL_USERS, allUsers);
    
    return success;
  },

  // Get current user
  getCurrentUser: () => {
    return storage.get(KEYS.CURRENT_USER);
  },

  // Get all users (for admin)
  getAllUsers: () => {
    return storage.get(KEYS.ALL_USERS, {});
  },

  // Clear current user (logout)
  clearCurrentUser: () => {
    return storage.remove(KEYS.CURRENT_USER);
  }
};

// Request management (global storage)
export const requestStorage = {
  // Get all requests across all users
  getAllRequests: () => {
    return storage.get(KEYS.ALL_REQUESTS, []);
  },

  // Save all requests
  saveAllRequests: (requests) => {
    return storage.set(KEYS.ALL_REQUESTS, requests);
  },

  // Add new request
  addRequest: (request) => {
    const allRequests = requestStorage.getAllRequests();
    const counter = storage.get(KEYS.REQUEST_COUNTER, 1000);
    
    const newRequest = {
      ...request,
      id: counter + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    allRequests.push(newRequest);
    storage.set(KEYS.REQUEST_COUNTER, counter + 1);
    requestStorage.saveAllRequests(allRequests);
    
    return newRequest;
  },

  // Update request
  updateRequest: (requestId, updates) => {
    const allRequests = requestStorage.getAllRequests();
    const updatedRequests = allRequests.map(req => 
      req.id === requestId 
        ? { ...req, ...updates, updatedAt: new Date().toISOString() }
        : req
    );
    
    requestStorage.saveAllRequests(updatedRequests);
    return updatedRequests.find(req => req.id === requestId);
  },

  // Get requests for specific user
  getUserRequests: (userId) => {
    const allRequests = requestStorage.getAllRequests();
    return allRequests.filter(req => req.userId === userId);
  }
};

// Message management (global storage)
export const messageStorage = {
  // Get all conversations
  getAllMessages: () => {
    return storage.get(KEYS.ALL_MESSAGES, {});
  },

  // Save all messages
  saveAllMessages: (messages) => {
    return storage.set(KEYS.ALL_MESSAGES, messages);
  },

  // Get messages for user
  getUserMessages: (userId) => {
    const allMessages = messageStorage.getAllMessages();
    return allMessages[userId] || [];
  },

  // Add message
  addMessage: (userId, message) => {
    const allMessages = messageStorage.getAllMessages();
    if (!allMessages[userId]) {
      allMessages[userId] = [];
    }
    
    const newMessage = {
      ...message,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString()
    };
    
    allMessages[userId].push(newMessage);
    messageStorage.saveAllMessages(allMessages);
    
    return newMessage;
  },

  // Save user info for messages

  saveMessageUser: (userId, user) => {
    const messageUsers = storage.get(KEYS.MESSAGE_USERS, {});
    messageUsers[userId] = {
      id: userId,

  saveMessageUser: (user) => {
    const messageUsers = storage.get(KEYS.MESSAGE_USERS, {});
    messageUsers[user.id] = {
      id: user.id,

      name: user.name,
      email: user.email,
      lastMessage: new Date().toISOString()
    };
    return storage.set(KEYS.MESSAGE_USERS, messageUsers);
  },

  // Get users who have sent messages
  getMessageUsers: () => {
    return storage.get(KEYS.MESSAGE_USERS, {});
  }
};

// Truck and dispatch management
export const truckStorage = {
  // Initialize default trucks if not exist
  initializeTrucks: () => {
    let trucks = storage.get(KEYS.TRUCKS);
    
    if (!trucks) {
      trucks = [
        {
          id: 'truck-001',
          name: 'Truck Alpha',
          driver: 'John Smith',
          phone: '+254712345678',
          status: 'available',
          location: { lat: -1.2921, lng: 36.8219, address: 'Nairobi, Kenya' },
          lastUpdate: new Date().toISOString()
        },
        {
          id: 'truck-002',
          name: 'Truck Beta',
          driver: 'Mike Johnson',
          phone: '+254712345679',
          status: 'available',
          location: { lat: -1.2841, lng: 36.8155, address: 'Westlands, Nairobi' },
          lastUpdate: new Date().toISOString()
        },
        {
          id: 'truck-003',
          name: 'Truck Gamma',
          driver: 'David Wilson',
          phone: '+254712345680',
          status: 'maintenance',
          location: { lat: -1.3032, lng: 36.8339, address: 'Karen, Nairobi' },
          lastUpdate: new Date().toISOString()
        }
      ];
      
      storage.set(KEYS.TRUCKS, trucks);
    }
    
    return trucks;
  },

  // Get all trucks
  getTrucks: () => {
    return storage.get(KEYS.TRUCKS, []);
  },

  // Save trucks
  saveTrucks: (trucks) => {
    return storage.set(KEYS.TRUCKS, trucks);
  },

  // Get dispatches
  getDispatches: () => {
    return storage.get(KEYS.DISPATCHES, []);
  },

  // Save dispatches
  saveDispatches: (dispatches) => {
    return storage.set(KEYS.DISPATCHES, dispatches);
  }
};

// Location management
export const locationStorage = {
  // Save user location
  saveUserLocation: (userId, location) => {
    const locations = storage.get(KEYS.USER_LOCATIONS, {});
    locations[userId] = {
      ...location,
      timestamp: new Date().toISOString()
    };
    return storage.set(KEYS.USER_LOCATIONS, locations);
  },

  // Get user location
  getUserLocation: (userId) => {
    const locations = storage.get(KEYS.USER_LOCATIONS, {});
    return locations[userId] || null;
  }
};

// Notification management
export const notificationStorage = {
  // Get user notifications
  getUserNotifications: (userId) => {
    const notifications = storage.get(KEYS.NOTIFICATIONS, {});
    return notifications[userId] || [];
  },

  // Save user notifications
  saveUserNotifications: (userId, notifications) => {
    const allNotifications = storage.get(KEYS.NOTIFICATIONS, {});
    allNotifications[userId] = notifications;
    return storage.set(KEYS.NOTIFICATIONS, allNotifications);
  },

  // Add notification
  addNotification: (userId, notification) => {
    const notifications = notificationStorage.getUserNotifications(userId);
    const newNotification = {
      ...notification,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false
    };
    
    notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    const trimmed = notifications.slice(0, 50);
    notificationStorage.saveUserNotifications(userId, trimmed);
    
    return newNotification;
<<<<<<< HEAD
  },

  // Add global notification (for all admins)
  addGlobalNotification: (notification) => {
    // Get all users and add notification to all admins
    const allUsers = userStorage.getAllUsers();
    const adminUsers = Object.values(allUsers).filter(user => user.isAdmin);
    
    const newNotification = {
      ...notification,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Add to each admin's notifications
    adminUsers.forEach(admin => {
      notificationStorage.addNotification(admin.id, newNotification);
    });
    
    return newNotification;
=======
>>>>>>> 323712cc (Checkpoint before follow-up message)
  }
};

// Backup and restore
export const backupStorage = {
  // Create full backup
  createBackup: () => {
    const backup = {
      version: STORAGE_VERSION,
      timestamp: new Date().toISOString(),
      data: {
        users: storage.get(KEYS.ALL_USERS, {}),
        requests: storage.get(KEYS.ALL_REQUESTS, []),
        messages: storage.get(KEYS.ALL_MESSAGES, {}),
        messageUsers: storage.get(KEYS.MESSAGE_USERS, {}),
        trucks: storage.get(KEYS.TRUCKS, []),
        dispatches: storage.get(KEYS.DISPATCHES, []),
        notifications: storage.get(KEYS.NOTIFICATIONS, {}),
        locations: storage.get(KEYS.USER_LOCATIONS, {}),
        settings: storage.get(KEYS.SYSTEM_SETTINGS, {})
      }
    };
    
    storage.set(KEYS.LAST_BACKUP, backup);
    return backup;
  },

  // Restore from backup
  restoreBackup: (backup) => {
    try {
      if (backup.version !== STORAGE_VERSION) {
        console.warn('Backup version mismatch');
        return false;
      }
      
      const { data } = backup;
      
      storage.set(KEYS.ALL_USERS, data.users || {});
      storage.set(KEYS.ALL_REQUESTS, data.requests || []);
      storage.set(KEYS.ALL_MESSAGES, data.messages || {});
      storage.set(KEYS.MESSAGE_USERS, data.messageUsers || {});
      storage.set(KEYS.TRUCKS, data.trucks || []);
      storage.set(KEYS.DISPATCHES, data.dispatches || []);
      storage.set(KEYS.NOTIFICATIONS, data.notifications || {});
      storage.set(KEYS.USER_LOCATIONS, data.locations || {});
      storage.set(KEYS.SYSTEM_SETTINGS, data.settings || {});
      
      return true;
    } catch (error) {
      console.error('Backup restore error:', error);
      return false;
    }
  }
};

// Initialize storage on first load
export const initializeStorage = () => {
  if (!storage.isAvailable()) {
    console.error('localStorage not available');
    return false;
  }
  
  // Initialize trucks if not exist
  truckStorage.initializeTrucks();
  
  // Create initial backup
  backupStorage.createBackup();
  
  return true;
};

export default {
  storage,
  userStorage,
  requestStorage,
  messageStorage,
  truckStorage,
  locationStorage,
  notificationStorage,
  backupStorage,
  initializeStorage
};