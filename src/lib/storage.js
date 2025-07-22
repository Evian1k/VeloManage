/**
 * Enhanced Storage System for AutoCare Pro
 * Provides robust data persistence with backup, validation, and recovery
 */

// Storage keys
const STORAGE_KEYS = {
  USER: 'autocare_user',
  BACKUP_PREFIX: 'autocare_backup_',
  SYNC_PREFIX: 'autocare_sync_',
  METADATA: 'autocare_metadata'
};

// IndexedDB configuration
const DB_NAME = 'AutoCareDB';
const DB_VERSION = 1;
const STORES = {
  REQUESTS: 'service_requests',
  VEHICLES: 'vehicles',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  BACKUPS: 'backups'
};

class StorageManager {
  constructor() {
    this.db = null;
    this.initDB();
    this.setupStorageListeners();
  }

  // Initialize IndexedDB
  async initDB() {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Create object stores
          Object.values(STORES).forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              const store = db.createObjectStore(storeName, { 
                keyPath: 'id', 
                autoIncrement: true 
              });
              
              // Add indexes for common queries
              if (storeName === STORES.REQUESTS) {
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('status', 'status', { unique: false });
                store.createIndex('date', 'createdAt', { unique: false });
              }
              
              if (storeName === STORES.VEHICLES) {
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('licensePlate', 'licensePlate', { unique: true });
              }
              
              if (storeName === STORES.MESSAGES) {
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('timestamp', 'timestamp', { unique: false });
              }
            }
          });
        };
      });
    } catch (error) {
      console.warn('IndexedDB not available, falling back to localStorage:', error);
    }
  }

  // Enhanced localStorage with validation and backup
  setItem(key, data, options = {}) {
    try {
      const { backup = true, validate = true, compress = false } = options;
      
      // Validate data if required
      if (validate && !this.validateData(key, data)) {
        throw new Error(`Invalid data for key: ${key}`);
      }

      const serializedData = JSON.stringify(data);
      
      // Check localStorage quota
      if (this.checkQuota(serializedData)) {
        localStorage.setItem(key, serializedData);
        
        // Create backup if enabled
        if (backup) {
          this.createBackup(key, data);
        }
        
        // Update metadata
        this.updateMetadata(key, data);
        
        // Trigger storage event for cross-tab sync
        window.dispatchEvent(new CustomEvent('autocareStorageUpdate', {
          detail: { key, data, timestamp: Date.now() }
        }));
        
        return true;
      } else {
        // Try to free space
        this.cleanupOldData();
        localStorage.setItem(key, serializedData);
        return true;
      }
    } catch (error) {
      console.error('Error storing data:', error);
      
      // Try fallback storage in IndexedDB
      if (this.db) {
        return this.setItemIDB(key, data);
      }
      
      return false;
    }
  }

  getItem(key, options = {}) {
    try {
      const { fallback = null, validate = true } = options;
      
      let data = localStorage.getItem(key);
      
      if (data) {
        data = JSON.parse(data);
        
        if (validate && !this.validateData(key, data)) {
          console.warn(`Corrupted data detected for key: ${key}, attempting recovery`);
          return this.recoverData(key, fallback);
        }
        
        return data;
      }
      
      // Try IndexedDB fallback
      if (this.db) {
        return this.getItemIDB(key, fallback);
      }
      
      return fallback;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return this.recoverData(key, options.fallback);
    }
  }

  // IndexedDB operations
  async setItemIDB(key, data) {
    if (!this.db) return false;
    
    try {
      const transaction = this.db.transaction([STORES.BACKUPS], 'readwrite');
      const store = transaction.objectStore(STORES.BACKUPS);
      
      await store.put({
        key,
        data,
        timestamp: Date.now(),
        source: 'fallback'
      });
      
      return true;
    } catch (error) {
      console.error('IndexedDB storage error:', error);
      return false;
    }
  }

  async getItemIDB(key, fallback = null) {
    if (!this.db) return fallback;
    
    try {
      const transaction = this.db.transaction([STORES.BACKUPS], 'readonly');
      const store = transaction.objectStore(STORES.BACKUPS);
      
      return new Promise((resolve) => {
        const request = store.get(key);
        request.onsuccess = () => {
          resolve(request.result ? request.result.data : fallback);
        };
        request.onerror = () => resolve(fallback);
      });
    } catch (error) {
      console.error('IndexedDB retrieval error:', error);
      return fallback;
    }
  }

  // Data validation
  validateData(key, data) {
    if (!data) return false;
    
    // Key-specific validation
    if (key.includes('user')) {
      return data.id && data.email;
    }
    
    if (key.includes('requests')) {
      return Array.isArray(data) && data.every(req => req.id && req.userId);
    }
    
    if (key.includes('vehicles')) {
      return Array.isArray(data) && data.every(vehicle => vehicle.id && vehicle.licensePlate);
    }
    
    return true; // Basic validation passed
  }

  // Create backup
  createBackup(key, data) {
    try {
      const backupKey = `${STORAGE_KEYS.BACKUP_PREFIX}${key}_${Date.now()}`;
      const backupData = {
        originalKey: key,
        data,
        timestamp: Date.now(),
        checksum: this.generateChecksum(data)
      };
      
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      // Keep only last 5 backups per key
      this.cleanupBackups(key);
    } catch (error) {
      console.warn('Backup creation failed:', error);
    }
  }

  // Recover corrupted data
  recoverData(key, fallback = null) {
    try {
      // Look for recent backups
      const backups = this.getBackups(key);
      
      if (backups.length > 0) {
        // Get the most recent valid backup
        const latestBackup = backups.sort((a, b) => b.timestamp - a.timestamp)[0];
        
        if (this.validateChecksum(latestBackup.data, latestBackup.checksum)) {
          console.log(`Data recovered from backup for key: ${key}`);
          this.setItem(key, latestBackup.data, { backup: false }); // Restore without creating new backup
          return latestBackup.data;
        }
      }
      
      console.warn(`No valid backup found for key: ${key}`);
      return fallback;
    } catch (error) {
      console.error('Data recovery failed:', error);
      return fallback;
    }
  }

  // Get all backups for a key
  getBackups(key) {
    const backups = [];
    const prefix = `${STORAGE_KEYS.BACKUP_PREFIX}${key}_`;
    
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(prefix)) {
        try {
          const backup = JSON.parse(localStorage.getItem(storageKey));
          backups.push(backup);
        } catch (error) {
          console.warn('Invalid backup found:', storageKey);
        }
      }
    }
    
    return backups;
  }

  // Cleanup old backups
  cleanupBackups(key) {
    const backups = this.getBackups(key);
    const prefix = `${STORAGE_KEYS.BACKUP_PREFIX}${key}_`;
    
    if (backups.length > 5) {
      const sorted = backups.sort((a, b) => b.timestamp - a.timestamp);
      const toDelete = sorted.slice(5);
      
      toDelete.forEach(backup => {
        const backupKey = `${prefix}${backup.timestamp}`;
        localStorage.removeItem(backupKey);
      });
    }
  }

  // Generate simple checksum
  generateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Validate checksum
  validateChecksum(data, expectedChecksum) {
    return this.generateChecksum(data) === expectedChecksum;
  }

  // Check localStorage quota
  checkQuota(newData) {
    try {
      const testKey = 'quota_test';
      localStorage.setItem(testKey, newData);
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        return false;
      }
      throw error;
    }
  }

  // Clean up old data to free space
  cleanupOldData() {
    try {
      // Remove old backups (older than 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEYS.BACKUP_PREFIX)) {
          try {
            const backup = JSON.parse(localStorage.getItem(key));
            if (backup.timestamp < thirtyDaysAgo) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            localStorage.removeItem(key); // Remove corrupted backup
          }
        }
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  // Update metadata
  updateMetadata(key, data) {
    try {
      const metadata = this.getMetadata();
      metadata[key] = {
        size: JSON.stringify(data).length,
        lastUpdated: Date.now(),
        version: (metadata[key]?.version || 0) + 1
      };
      
      localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.warn('Metadata update failed:', error);
    }
  }

  // Get metadata
  getMetadata() {
    try {
      const metadata = localStorage.getItem(STORAGE_KEYS.METADATA);
      return metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      return {};
    }
  }

  // Setup cross-tab synchronization
  setupStorageListeners() {
    // Listen for storage events from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('autocare_')) {
        window.dispatchEvent(new CustomEvent('autocareDataSync', {
          detail: {
            key: event.key,
            oldValue: event.oldValue,
            newValue: event.newValue,
            url: event.url
          }
        }));
      }
    });

    // Listen for custom storage events
    window.addEventListener('autocareStorageUpdate', (event) => {
      // Handle cross-tab updates if needed
      console.log('Storage updated:', event.detail);
    });
  }

  // Export data for backup
  exportData() {
    const data = {};
    const metadata = this.getMetadata();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('autocare_') && !key.startsWith(STORAGE_KEYS.BACKUP_PREFIX)) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch (error) {
          console.warn(`Failed to export key: ${key}`);
        }
      }
    }
    
    return {
      data,
      metadata,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Import data from backup
  importData(backupData) {
    try {
      if (!backupData.data || !backupData.version) {
        throw new Error('Invalid backup data format');
      }
      
      // Clear existing data
      this.clearAllData();
      
      // Import data
      Object.entries(backupData.data).forEach(([key, value]) => {
        this.setItem(key, value, { backup: false });
      });
      
      // Import metadata
      if (backupData.metadata) {
        localStorage.setItem(STORAGE_KEYS.METADATA, JSON.stringify(backupData.metadata));
      }
      
      return true;
    } catch (error) {
      console.error('Data import failed:', error);
      return false;
    }
  }

  // Clear all AutoCare data
  clearAllData() {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('autocare_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Get storage statistics
  getStorageStats() {
    const metadata = this.getMetadata();
    let totalSize = 0;
    let itemCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('autocare_')) {
        const value = localStorage.getItem(key);
        totalSize += value ? value.length : 0;
        itemCount++;
      }
    }
    
    return {
      totalSize,
      itemCount,
      formattedSize: this.formatBytes(totalSize),
      metadata,
      lastCleanup: metadata.lastCleanup || null
    };
  }

  // Format bytes for display
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Create singleton instance
const storageManager = new StorageManager();

// Enhanced storage utilities
export const storage = {
  // Basic operations
  set: (key, data, options) => storageManager.setItem(key, data, options),
  get: (key, options) => storageManager.getItem(key, options),
  
  // Specialized methods for AutoCare data
  setUserData: (userData) => storageManager.setItem(STORAGE_KEYS.USER, userData),
  getUserData: () => storageManager.getItem(STORAGE_KEYS.USER),
  
  setRequests: (userId, requests) => storageManager.setItem(`autocare_requests_${userId}`, requests),
  getRequests: (userId) => storageManager.getItem(`autocare_requests_${userId}`, { fallback: [] }),
  
  setVehicles: (vehicles) => storageManager.setItem('autocare_vehicles', vehicles),
  getVehicles: () => storageManager.getItem('autocare_vehicles', { fallback: [] }),
  
  setMessages: (userId, messages) => storageManager.setItem(`autocare_messages_${userId}`, messages),
  getMessages: (userId) => storageManager.getItem(`autocare_messages_${userId}`, { fallback: [] }),
  
  setNotifications: (userId, notifications) => storageManager.setItem(`autocare_notifications_${userId}`, notifications),
  getNotifications: (userId) => storageManager.getItem(`autocare_notifications_${userId}`, { fallback: [] }),
  
  // Backup and recovery
  exportData: () => storageManager.exportData(),
  importData: (data) => storageManager.importData(data),
  clearAll: () => storageManager.clearAllData(),
  
  // Statistics and monitoring
  getStats: () => storageManager.getStorageStats(),
  
  // Cleanup
  cleanup: () => storageManager.cleanupOldData()
};

export default storage;