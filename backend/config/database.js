import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';

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

  // Get multiple rows
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
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
        role TEXT DEFAULT 'user',
        is_admin BOOLEAN DEFAULT FALSE,
        join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
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
        vehicle_info TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'in_progress', 'completed', 'cancelled')),
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
        FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // SMS logs table
    await dbAsync.run(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status)');
    await dbAsync.run('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)');

    console.log('✅ Database tables initialized successfully');
    
    // Insert default admin users if they don't exist
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

  const adminPassword = 'autocarpro12k@12k.wwc';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  for (const admin of adminUsers) {
    try {
      // Check if admin already exists
      const existingAdmin = await dbAsync.get(
        'SELECT id FROM users WHERE email = ?',
        [admin.email]
      );

      if (!existingAdmin) {
        await dbAsync.run(`
          INSERT INTO users (name, email, phone, password_hash, role, is_admin, join_date)
          VALUES (?, ?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)
        `, [admin.name, admin.email, admin.phone, hashedPassword, admin.role]);

        console.log(`✅ Created admin user: ${admin.email}`);
      }
    } catch (error) {
      console.error(`❌ Error creating admin ${admin.email}:`, error);
    }
  }
};

// Close database connection
export const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Database connection closed');
        resolve();
      }
    });
  });
};

// Error handling
process.on('SIGINT', async () => {
  console.log('\n🔄 Gracefully shutting down database...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Gracefully shutting down database...');
  await closeDatabase();
  process.exit(0);
});