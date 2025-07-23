import express from 'express';
import bcrypt from 'bcryptjs';
import { dbAsync } from '../config/database.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { sendRegistrationNotification, sendWelcomeSMS } from '../services/smsService.js';

const router = express.Router();

// Admin users configuration
const ADMIN_USERS = {
  'emmanuel.evian@autocare.com': {
    password: 'autocarpro12k@12k.wwc',
    name: 'Emmanuel Evian',
    role: 'Main Admin',
    phone: '+254746720669'
  },
  'ibrahim.mohamud@autocare.com': {
    password: 'autocarpro12k@12k.wwc',
    name: 'Ibrahim Mohamud',
    role: 'Admin',
    phone: '+254729549671'
  },
  'joel.nganga@autocare.com': {
    password: 'autocarpro12k@12k.wwc',
    name: 'Joel Ng\'ang\'a',
    role: 'Admin',
    phone: '+254757735896'
  },
  'patience.karanja@autocare.com': {
    password: 'autocarpro12k@12k.wwc',
    name: 'Patience Karanja',
    role: 'Admin',
    phone: '+254718168860'
  },
  'joyrose.kinuthia@autocare.com': {
    password: 'autocarpro12k@12k.wwc',
    name: 'Joyrose Kinuthia',
    role: 'Admin',
    phone: '+254718528547'
  }
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if user already exists
    const existingUser = await dbAsync.get(
      'SELECT id FROM users WHERE email = ? OR (phone IS NOT NULL AND phone = ?)',
      [email.toLowerCase(), phone]
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email or phone number'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Check if this is an admin user
    const isAdmin = ADMIN_USERS.hasOwnProperty(email.toLowerCase());
    const adminData = ADMIN_USERS[email.toLowerCase()];

    // Create user
    const result = await dbAsync.run(`
      INSERT INTO users (name, email, phone, password_hash, role, is_admin, join_date, last_login)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      name.trim(),
      email.toLowerCase().trim(),
      phone ? phone.trim() : null,
      passwordHash,
      isAdmin ? adminData.role : 'user',
      isAdmin
    ]);

    // Get the created user
    const newUser = await dbAsync.get(
      'SELECT id, name, email, phone, role, is_admin, join_date FROM users WHERE id = ?',
      [result.id]
    );

    // Generate JWT token
    const token = generateToken(newUser.id);

    // Send SMS notifications (don't fail registration if SMS fails)
    setTimeout(async () => {
      try {
        await Promise.all([
          sendRegistrationNotification(newUser),
          sendWelcomeSMS(newUser)
        ]);
      } catch (smsError) {
        console.warn('SMS notification failed:', smsError);
      }
    }, 100);

    console.log(`✅ New user registered: ${newUser.email} (${isAdmin ? 'Admin' : 'User'})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          isAdmin: newUser.is_admin,
          joinDate: newUser.join_date
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both email and password'
      });
    }

    // Check if this is an admin login with predefined credentials
    const adminUser = ADMIN_USERS[email.toLowerCase().trim()];
    
    if (adminUser) {
      // Admin login with predefined password
      if (password !== adminUser.password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid admin credentials'
        });
      }

      // Get or create admin user in database
      let user = await dbAsync.get('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
      
      if (!user) {
        // Create admin user if doesn't exist
        const passwordHash = await bcrypt.hash(adminUser.password, 10);
        const result = await dbAsync.run(`
          INSERT INTO users (name, email, phone, password_hash, role, is_admin, join_date)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
          adminUser.name,
          email.toLowerCase(),
          adminUser.phone,
          passwordHash,
          adminUser.role,
          true
        ]);

        user = await dbAsync.get('SELECT * FROM users WHERE id = ?', [result.id]);
      }

      // Update last login
      await dbAsync.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

      const token = generateToken(user.id);

      console.log(`👑 Admin login: ${user.email}`);

      return res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isAdmin: user.is_admin,
            joinDate: user.join_date,
            lastLogin: new Date().toISOString()
          },
          token
        }
      });
    }

    // Regular user login
    const user = await dbAsync.get(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [email.toLowerCase().trim(), email.trim()]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please register first.'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Update last login
    await dbAsync.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = generateToken(user.id);

    console.log(`👤 User login: ${user.email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isAdmin: user.is_admin,
          joinDate: user.join_date,
          lastLogin: new Date().toISOString()
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbAsync.get(
      'SELECT id, name, email, phone, role, is_admin, join_date, last_login FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id;

    // Validate name
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Name must be at least 2 characters long'
      });
    }

    // Update user profile
    await dbAsync.run(`
      UPDATE users 
      SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name.trim(), phone ? phone.trim() : null, userId]);

    // Get updated user
    const updatedUser = await dbAsync.get(
      'SELECT id, name, email, phone, role, is_admin, join_date, last_login FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * POST /api/auth/logout
 * User logout (optional endpoint for cleanup)
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, just return success
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

export default router;