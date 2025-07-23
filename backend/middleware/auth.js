import jwt from 'jsonwebtoken';
import { dbAsync } from '../config/database.js';

// Verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Handle localStorage tokens (for demo/fallback mode)
    if (token.startsWith('localStorage-')) {
      console.log('🔓 localStorage token detected, creating mock user');
      
      // Extract user type and ID from token
      const tokenParts = token.split('-');
      const userType = tokenParts[1]; // 'admin' or 'user'
      const userId = tokenParts[2] || 'mock-user';
      
      // Create mock user for localStorage mode
      const mockUser = {
        id: userId,
        name: userType === 'admin' ? 'Admin User' : 'Demo User',
        email: userType === 'admin' ? 'admin@autocare.com' : 'user@autocare.com',
        phone: '+1234567890',
        role: userType === 'admin' ? 'Admin' : 'User',
        is_admin: userType === 'admin'
      };
      
      req.user = mockUser;
      next();
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await dbAsync.get(
      'SELECT id, name, email, phone, role, is_admin FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Verify admin role
export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await dbAsync.get(
        'SELECT id, name, email, phone, role, is_admin FROM users WHERE id = ?',
        [decoded.userId]
      );
      
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Continue without authentication
    console.warn('Optional auth failed:', error.message);
  }
  
  next();
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export default {
  authenticateToken,
  requireAdmin,
  optionalAuth,
  generateToken
};