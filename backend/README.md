# AutoCare Pro Backend

A complete Node.js backend API for the AutoCare Pro vehicle service management system.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with role-based access
- **Real-time Communication** - Socket.IO for live notifications
- **SMS Integration** - Africa's Talking SMS API for notifications
- **Database** - SQLite with automatic schema management
- **Security** - Helmet, CORS, rate limiting, input validation
- **Logging** - Winston for comprehensive request/error logging
- **Admin Panel** - Special admin users with predefined credentials

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Africa's Talking account (for SMS) - optional

## 🛠️ Installation

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Initialize database:**
   ```bash
   npm run init-db
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

### Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=./database/autocare.db

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# SMS (Africa's Talking)
AFRICASTALKING_USERNAME=your-username
AFRICASTALKING_API_KEY=your-api-key

# Frontend
FRONTEND_URL=http://localhost:5173
```

### Admin Users

The system has 5 predefined admin users:

```
emmanuel.evian@autocare.com     (+254746720669)
ibrahim.mohamud@autocare.com    (+254729549671)
joel.nganga@autocare.com        (+254757735896)
patience.karanja@autocare.com   (+254718168860)
joyrose.kinuthia@autocare.com   (+254718528547)

Password for all admins: autocarpro12k@12k.wwc
```

## 📡 API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register new user
- `POST /login` - User/admin login
- `GET /me` - Get current user info (protected)
- `PUT /profile` - Update user profile (protected)
- `POST /logout` - Logout (protected)

### Request/Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description"
}
```

## 🗄️ Database Schema

### Users Table
```sql
users (
  id INTEGER PRIMARY KEY,
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
```

### Service Requests Table
```sql
service_requests (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  service_type TEXT NOT NULL,
  vehicle_info TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  priority TEXT DEFAULT 'normal',
  estimated_completion DATETIME,
  tracking_enabled BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
)
```

### Messages Table
```sql
messages (
  id INTEGER PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  is_auto_reply BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users (id)
)
```

### Additional Tables
- `trucks` - Truck fleet management
- `notifications` - User notifications
- `sms_logs` - SMS delivery tracking

## 🔄 Real-time Events (Socket.IO)

### Client Events
- `join-admin` - Admin joins admin room
- `join-user` - User joins user-specific room
- `new-message` - Send new message
- `service-update` - Service status update
- `truck-dispatch` - Truck dispatch notification
- `gps-update` - GPS location update

### Server Events
- `message-notification` - New message received
- `service-notification` - Service status changed
- `truck-notification` - Truck dispatched
- `gps-notification` - GPS location updated

## 📱 SMS Integration

### Automatic SMS Triggers
- **User Registration** - Welcome SMS to user + notification to all admins
- **Service Updates** - Status change notifications
- **Truck Dispatch** - Dispatch confirmation with driver details

### SMS Configuration

1. **Sign up at Africa's Talking:**
   - Visit: https://africastalking.com/
   - Create account and get API credentials

2. **Update environment variables:**
   ```env
   AFRICASTALKING_USERNAME=your-username
   AFRICASTALKING_API_KEY=your-api-key
   ```

3. **Test SMS functionality:**
   - Register a user with a valid phone number
   - Check console logs for SMS delivery status

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevent API abuse
- **CORS Protection** - Controlled cross-origin access
- **Helmet Security** - Security headers
- **Input Validation** - Sanitized user inputs
- **SQL Injection Prevention** - Parameterized queries

## 📊 Logging

Logs are stored in:
- `logs/error.log` - Error messages only
- `logs/combined.log` - All log messages
- Console output in development

Log format includes:
- Timestamp
- Log level
- Request method and URL
- Response status and duration
- IP address

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Use secure JWT secret
3. Configure production database
4. Set up SMS credentials
5. Configure CORS for production domain

### Recommended Deployment Platforms
- **Railway** - Simple Node.js deployment
- **Heroku** - Popular platform
- **DigitalOcean App Platform** - Good performance
- **AWS EC2** - Full control

## 🧪 Testing

### Manual Testing

1. **Health Check:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **User Registration:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","phone":"+254700123456","password":"password123"}'
   ```

3. **Admin Login:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"emmanuel.evian@autocare.com","password":"autocarpro12k@12k.wwc"}'
   ```

## 🔧 Troubleshooting

### Common Issues

**Database Connection Error:**
- Check if `database/` directory exists
- Ensure SQLite3 is properly installed
- Verify file permissions

**SMS Not Sending:**
- Verify Africa's Talking credentials
- Check phone number format (+254...)
- Review SMS logs in database

**CORS Errors:**
- Update `FRONTEND_URL` in .env
- Check CORS origin configuration
- Verify frontend domain matches

**JWT Token Issues:**
- Verify JWT_SECRET is set
- Check token expiration (24h default)
- Ensure proper Authorization header format

### Logs and Debugging

Check logs for detailed error information:
```bash
tail -f logs/error.log
tail -f logs/combined.log
```

Enable verbose logging:
```env
NODE_ENV=development
```

## 📞 Support

For technical support or questions:
- Check logs first
- Review this documentation
- Test with provided curl commands
- Verify environment configuration

## 🎯 Next Steps

With the backend running, you can:
1. Test all API endpoints
2. Integrate with frontend
3. Configure SMS credentials
4. Set up production deployment
5. Monitor logs and performance

The backend is now **fully functional** and ready for production use! 🚀