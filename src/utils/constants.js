// Application Constants
export const APP_CONFIG = {
  name: 'AutoCare Pro',
  version: '1.0.0',
  description: 'Premium Car Management Information System',
  author: 'AutoCare Team'
};

// Service Types
export const SERVICE_TYPES = {
  BRAKE_REPAIR: 'Brake Repair',
  ROUTINE_3000KM: '3000km Routine Maintenance',
  VEHICLE_PICKUP: 'Vehicle Pickup',
  OIL_CHANGE: 'Oil Change',
  TIRE_REPLACEMENT: 'Tire Replacement',
  ENGINE_DIAGNOSTIC: 'Engine Diagnostic',
  TRANSMISSION_SERVICE: 'Transmission Service',
  AC_REPAIR: 'AC Repair',
  BATTERY_REPLACEMENT: 'Battery Replacement',
  SUSPENSION_REPAIR: 'Suspension Repair',
  EXHAUST_REPAIR: 'Exhaust System Repair',
  COOLING_SYSTEM: 'Cooling System Service'
};

// Service Status
export const SERVICE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  MANAGER: 'manager'
};

// Admin Users (for demo purposes)
export const ADMIN_USERS = [
  'emmanuel.evian@autocare.com',
  'joel.nganga@autocare.com',
  'ibrahim.mohamud@autocare.com',
  'patience.karanja@autocare.com',
  'joyrose.kinuthia@autocare.com'
];

// Spare Parts by Service Type
export const SPARE_PARTS = {
  [SERVICE_TYPES.BRAKE_REPAIR]: ['Brake Pads', 'Brake Discs', 'Brake Fluid', 'Brake Lines'],
  [SERVICE_TYPES.ROUTINE_3000KM]: ['Engine Oil', 'Oil Filter', 'Air Filter', 'Cabin Filter'],
  [SERVICE_TYPES.OIL_CHANGE]: ['Engine Oil', 'Oil Filter', 'Drain Plug Gasket'],
  [SERVICE_TYPES.TIRE_REPLACEMENT]: ['Tires', 'Valve Stems', 'Wheel Balancing Weights'],
  [SERVICE_TYPES.ENGINE_DIAGNOSTIC]: ['Spark Plugs', 'Ignition Coils', 'Sensors'],
  [SERVICE_TYPES.TRANSMISSION_SERVICE]: ['Transmission Fluid', 'Transmission Filter', 'Gaskets'],
  [SERVICE_TYPES.AC_REPAIR]: ['AC Refrigerant', 'AC Filter', 'AC Compressor', 'AC Belts'],
  [SERVICE_TYPES.BATTERY_REPLACEMENT]: ['Battery', 'Battery Terminals', 'Battery Hold Down'],
  [SERVICE_TYPES.SUSPENSION_REPAIR]: ['Shock Absorbers', 'Struts', 'Springs', 'Bushings'],
  [SERVICE_TYPES.EXHAUST_REPAIR]: ['Exhaust Pipe', 'Muffler', 'Catalytic Converter', 'Gaskets'],
  [SERVICE_TYPES.COOLING_SYSTEM]: ['Coolant', 'Thermostat', 'Water Pump', 'Radiator Hoses']
};

// Estimated Service Times (in hours)
export const SERVICE_DURATION = {
  [SERVICE_TYPES.BRAKE_REPAIR]: 2,
  [SERVICE_TYPES.ROUTINE_3000KM]: 1,
  [SERVICE_TYPES.OIL_CHANGE]: 0.5,
  [SERVICE_TYPES.TIRE_REPLACEMENT]: 1,
  [SERVICE_TYPES.ENGINE_DIAGNOSTIC]: 2,
  [SERVICE_TYPES.TRANSMISSION_SERVICE]: 3,
  [SERVICE_TYPES.AC_REPAIR]: 2,
  [SERVICE_TYPES.BATTERY_REPLACEMENT]: 0.5,
  [SERVICE_TYPES.SUSPENSION_REPAIR]: 4,
  [SERVICE_TYPES.EXHAUST_REPAIR]: 2,
  [SERVICE_TYPES.COOLING_SYSTEM]: 2
};

// Estimated Costs (in USD)
export const SERVICE_COSTS = {
  [SERVICE_TYPES.BRAKE_REPAIR]: 200,
  [SERVICE_TYPES.ROUTINE_3000KM]: 80,
  [SERVICE_TYPES.OIL_CHANGE]: 50,
  [SERVICE_TYPES.TIRE_REPLACEMENT]: 400,
  [SERVICE_TYPES.ENGINE_DIAGNOSTIC]: 150,
  [SERVICE_TYPES.TRANSMISSION_SERVICE]: 300,
  [SERVICE_TYPES.AC_REPAIR]: 250,
  [SERVICE_TYPES.BATTERY_REPLACEMENT]: 120,
  [SERVICE_TYPES.SUSPENSION_REPAIR]: 500,
  [SERVICE_TYPES.EXHAUST_REPAIR]: 300,
  [SERVICE_TYPES.COOLING_SYSTEM]: 200
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SERVICE_APPROVED: 'service_approved',
  SERVICE_REJECTED: 'service_rejected',
  SERVICE_COMPLETED: 'service_completed',
  SERVICE_IN_PROGRESS: 'service_in_progress',
  MAINTENANCE_REMINDER: 'maintenance_reminder',
  PAYMENT_DUE: 'payment_due',
  SYSTEM_UPDATE: 'system_update'
};

// API Endpoints (for future backend integration)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile'
  },
  SERVICES: {
    LIST: '/services',
    CREATE: '/services',
    UPDATE: '/services/:id',
    DELETE: '/services/:id',
    STATUS: '/services/:id/status'
  },
  VEHICLES: {
    LIST: '/vehicles',
    CREATE: '/vehicles',
    UPDATE: '/vehicles/:id',
    DELETE: '/vehicles/:id'
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all'
  },
  ADMIN: {
    STATS: '/admin/stats',
    USERS: '/admin/users',
    REQUESTS: '/admin/requests'
  }
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USER: 'autocare_user',
  TOKEN: 'autocare_token',
  REQUESTS: 'autocare_requests',
  VEHICLES: 'autocare_vehicles',
  NOTIFICATIONS: 'autocare_notifications',
  SETTINGS: 'autocare_settings',
  THEME: 'autocare_theme'
};

// Theme Configuration
export const THEME_CONFIG = {
  COLORS: {
    PRIMARY: '#ef4444',
    SECONDARY: '#dc2626',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#3b82f6'
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px'
  }
};

// Form Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  LICENSE_PLATE: /^[A-Z]{3}\s?[0-9]{3}[A-Z]?$/i,
  VIN: /^[A-HJ-NPR-Z0-9]{17}$/i
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  INPUT: 'YYYY-MM-DD',
  DATETIME: 'MMM DD, YYYY HH:mm',
  TIME: 'HH:mm'
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again later.',
  EMAIL_INVALID: 'Please enter a valid email address.',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long.',
  REQUIRED_FIELD: 'This field is required.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back! You have been logged in successfully.',
  REGISTER_SUCCESS: 'Account created successfully! Please log in.',
  SERVICE_CREATED: 'Service request submitted successfully.',
  SERVICE_UPDATED: 'Service request updated successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  VEHICLE_ADDED: 'Vehicle added successfully.',
  VEHICLE_UPDATED: 'Vehicle updated successfully.'
};