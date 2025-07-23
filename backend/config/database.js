import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database directory if it doesn't exist
const dbDir = join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = join(dbDir, 'autocare.db');

// Enable verbose mode for debugging
const sqlite = sqlite3.verbose();

// Create database connection
export const db = new sqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database:', dbPath);
    
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');
  }
});

// Database utility functions
export const dbAsync = {
  // Run a query with parameters
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  },

  // Get a single row
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  // Get all rows
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
};

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database tables...');

    // Users table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
        is_admin BOOLEAN DEFAULT FALSE,
        join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        vehicle_count INTEGER DEFAULT 0,
        last_service DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Service requests table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        service_type TEXT NOT NULL,
        vehicle_info TEXT NOT NULL, -- JSON string
        description TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected')),
        admin_notes TEXT,
        priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
        estimated_completion DATETIME,
        tracking_enabled BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Messages table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id TEXT NOT NULL,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        is_auto_reply BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Branches table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        address TEXT,
        contact_info TEXT, -- JSON string
        working_hours TEXT, -- JSON string
        staff_members TEXT, -- JSON array
        manager_name TEXT,
        capacity INTEGER,
        services_offered TEXT, -- JSON array
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULTвремени CURRENT_TIMESTAMP
      )
    `);

    // Trucks table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS trucks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        license_plate TEXT UNIQUE NOT NULL,
        model TEXT,
        capacity TEXT,
        driver_name TEXT,
        driver_phone TEXT,
        branch_id INTEGER,
        current_lat REAL,
        current_lng REAL,
        status TEXT DEFAULT 'available' CHECK(status IN ('available', 'dispatched', 'maintenance', 'offline')),
        assigned_request_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_request_id) REFERENCES service_requests (id) ON DELETE SET NULL
      )
    `);

    // Notifications table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        related_id INTEGER, -- Can reference service_request, message, etc.
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // SMS logs table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL,
        provider TEXT DEFAULT 'africastalking',
        response_data TEXT, -- JSON string
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Audit logs table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        details TEXT, -- JSON string
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Create indexes for better performance
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)');

    console.log('✅ Database tables initialized successfully');
    
    // Insert default admin users
    await insertDefaultAdmins();
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Insert default admin users
const insertDefaultAdmins = async () => {
  const adminUsers = [
    {
      name: 'Emmanuel Evian',
      email: 'emmanuel.evian@autocare.com',
      phone: '+254746720669',
      role: 'Main Admin'
    },
    {
      name: 'Ibrahim Mohamud',
      email: 'ibrahim.mohamud@autocare.com',
      phone: '+254729549671',
      role: 'Admin'
    },
    {
      name: 'Joel Ng\'ang\'a',
      email: 'joel.nganga@autocare.com',
      phone: '+254757735896',
      role: 'Admin'
    },
    {
      name: 'Patience Karanja',
      email: 'patience.karanja@autocare.com',
      phone: '+254718168860',
      role: 'Admin'
    },
    {
      name: 'Joyrose Kinuthia',
      email: 'joyrose.kinuthia@autocare.com',
      phone: '+254718528547',
      role: 'Admin'
    }
  ];

  for (const admin of adminUsers) {
    try {
      // Check if admin already exists
      const existing = await dbAsync.get('SELECT id FROM users WHERE email = ?', [admin.email]);
      
      if (!existing) {
        // Insert admin with default password (will be hashed)
        await dbAsync.run(`
          INSERT INTO users (name, email, phone, password_hash, role, is_admin)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          admin.name,
          admin.email,
          admin.phone,
          '$2a$10$defaulthashwillbereplaced', // This will be replaced with actual hash
          admin.role,
          true
        ]);
        
        console.log(`✅ Created admin user: ${admin.email}`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not create admin ${admin.email}:`, error.message);
    }
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});

export default db;