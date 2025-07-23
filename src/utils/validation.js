import { VALIDATION_RULES, ERROR_MESSAGES } from './constants.js';

/**
 * Validates an email address
 * @param {string} email - Email to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED_FIELD };
  }
  
  if (!VALIDATION_RULES.EMAIL.test(email)) {
    return { isValid: false, error: ERROR_MESSAGES.EMAIL_INVALID };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validates a password
 * @param {string} password - Password to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED_FIELD };
  }
  
  if (password.length < 6) {
    return { isValid: false, error: ERROR_MESSAGES.PASSWORD_TOO_SHORT };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validates a phone number
 * @param {string} phone - Phone number to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED_FIELD };
  }
  
  if (!VALIDATION_RULES.PHONE.test(phone)) {
    return { isValid: false, error: 'Please enter a valid phone number.' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validates a license plate
 * @param {string} licensePlate - License plate to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateLicensePlate = (licensePlate) => {
  if (!licensePlate) {
    return { isValid: false, error: ERROR_MESSAGES.REQUIRED_FIELD };
  }
  
  if (!VALIDATION_RULES.LICENSE_PLATE.test(licensePlate)) {
    return { isValid: false, error: 'Please enter a valid license plate (e.g., KDA 123A).' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validates a VIN number
 * @param {string} vin - VIN to validate
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateVIN = (vin) => {
  if (!vin) {
    return { isValid: true, error: null }; // VIN is optional in most cases
  }
  
  if (!VALIDATION_RULES.VIN.test(vin)) {
    return { isValid: false, error: 'Please enter a valid 17-character VIN.' };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validates a required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field
 * @returns {object} - { isValid: boolean, error: string }
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validates a vehicle form
 * @param {object} vehicle - Vehicle object to validate
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateVehicle = (vehicle) => {
  const errors = {};
  let isValid = true;
  
  // Validate make
  const makeValidation = validateRequired(vehicle.make, 'Vehicle make');
  if (!makeValidation.isValid) {
    errors.make = makeValidation.error;
    isValid = false;
  }
  
  // Validate model
  const modelValidation = validateRequired(vehicle.model, 'Vehicle model');
  if (!modelValidation.isValid) {
    errors.model = modelValidation.error;
    isValid = false;
  }
  
  // Validate year
  const yearValidation = validateRequired(vehicle.year, 'Vehicle year');
  if (!yearValidation.isValid) {
    errors.year = yearValidation.error;
    isValid = false;
  } else {
    const currentYear = new Date().getFullYear();
    const year = parseInt(vehicle.year);
    if (year < 1900 || year > currentYear + 1) {
      errors.year = `Year must be between 1900 and ${currentYear + 1}.`;
      isValid = false;
    }
  }
  
  // Validate license plate
  const licensePlateValidation = validateLicensePlate(vehicle.licensePlate);
  if (!licensePlateValidation.isValid) {
    errors.licensePlate = licensePlateValidation.error;
    isValid = false;
  }
  
  // Validate VIN (optional)
  const vinValidation = validateVIN(vehicle.vin);
  if (!vinValidation.isValid) {
    errors.vin = vinValidation.error;
    isValid = false;
  }
  
  return { isValid, errors };
};

/**
 * Validates a service request form
 * @param {object} request - Service request object to validate
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateServiceRequest = (request) => {
  const errors = {};
  let isValid = true;
  
  // Validate service type
  const serviceTypeValidation = validateRequired(request.serviceType, 'Service type');
  if (!serviceTypeValidation.isValid) {
    errors.serviceType = serviceTypeValidation.error;
    isValid = false;
  }
  
  // Validate vehicle info
  const vehicleInfoValidation = validateRequired(request.vehicleInfo, 'Vehicle information');
  if (!vehicleInfoValidation.isValid) {
    errors.vehicleInfo = vehicleInfoValidation.error;
    isValid = false;
  }
  
  // Validate description
  const descriptionValidation = validateRequired(request.description, 'Service description');
  if (!descriptionValidation.isValid) {
    errors.description = descriptionValidation.error;
    isValid = false;
  }
  
  // Validate contact number
  if (request.contactNumber) {
    const phoneValidation = validatePhone(request.contactNumber);
    if (!phoneValidation.isValid) {
      errors.contactNumber = phoneValidation.error;
      isValid = false;
    }
  }
  
  // Validate preferred date (if provided)
  if (request.preferredDate) {
    const selectedDate = new Date(request.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      errors.preferredDate = 'Preferred date cannot be in the past.';
      isValid = false;
    }
  }
  
  return { isValid, errors };
};

/**
 * Validates user registration form
 * @param {object} user - User object to validate
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateUserRegistration = (user) => {
  const errors = {};
  let isValid = true;
  
  // Validate name
  const nameValidation = validateRequired(user.name, 'Name');
  if (!nameValidation.isValid) {
    errors.name = nameValidation.error;
    isValid = false;
  }
  
  // Validate email
  const emailValidation = validateEmail(user.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
    isValid = false;
  }
  
  // Validate password
  const passwordValidation = validatePassword(user.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error;
    isValid = false;
  }
  
  // Validate confirm password
  if (user.password !== user.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
    isValid = false;
  }
  
  // Validate phone (optional)
  if (user.phone) {
    const phoneValidation = validatePhone(user.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error;
      isValid = false;
    }
  }
  
  return { isValid, errors };
};

/**
 * Validates user login form
 * @param {object} credentials - Login credentials to validate
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateUserLogin = (credentials) => {
  const errors = {};
  let isValid = true;
  
  // Validate email
  const emailValidation = validateEmail(credentials.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error;
    isValid = false;
  }
  
  // Validate password
  const passwordValidation = validateRequired(credentials.password, 'Password');
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error;
    isValid = false;
  }
  
  return { isValid, errors };
};

/**
 * Sanitizes user input to prevent XSS attacks
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validates and sanitizes form data
 * @param {object} data - Form data to validate and sanitize
 * @param {object} validationRules - Validation rules to apply
 * @returns {object} - { isValid: boolean, errors: object, sanitizedData: object }
 */
export const validateAndSanitizeForm = (data, validationRules) => {
  const errors = {};
  const sanitizedData = {};
  let isValid = true;
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    const rule = validationRules[key];
    
    if (rule) {
      const validation = rule(value);
      if (!validation.isValid) {
        errors[key] = validation.error;
        isValid = false;
      }
    }
    
    // Sanitize string values
    sanitizedData[key] = typeof value === 'string' ? sanitizeInput(value) : value;
  });
  
  return { isValid, errors, sanitizedData };
};