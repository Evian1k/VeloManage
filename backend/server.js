import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import winston from 'winston';

// Load environment variables
dotenv.config();

// Import configurations and routes
import { initializeDatabase } from './config/database.js';
import authRoutes from './routes/auth.js';
import servicesRoutes from './routes/services.js';
import messagesRoutes from './routes/messages.js';

// Create Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'autocare-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false // Allow frontend to embed resources
}));

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000', // Alternative dev port
    'https://your-domain.com' // Production domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AutoCare Pro Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/messages', messagesRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.id}`);

  // Join admin room
  socket.on('join-admin', (data) => {
    socket.join('admins');
    console.log(`👑 Admin joined: ${socket.id}`);
  });

  // Join user room
  socket.on('join-user', (data) => {
    const { userId } = data;
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined: ${socket.id}`);
  });

  // Handle new message
  socket.on('new-message', (data) => {
    const { senderId, receiverId, message, isAdmin } = data;
    
    if (isAdmin) {
      // Admin sending to user
      io.to(`user-${receiverId}`).emit('message-notification', {
        type: 'message',
        senderId,
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        timestamp: new Date().toISOString()
      });
    } else {
      // User sending to admins
      io.to('admins').emit('message-notification', {
        type: 'message',
        senderId,
        message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Handle service updates
  socket.on('service-update', (data) => {
    const { userId, requestId, status, message } = data;
    
    io.to(`user-${userId}`).emit('service-notification', {
      type: 'service',
      requestId,
      status,
      message,
      timestamp: new Date().toISOString()
    });
  });

  // Handle truck dispatch
  socket.on('truck-dispatch', (data) => {
    const { userId, truckId, requestId, message } = data;
    
    io.to(`user-${userId}`).emit('truck-notification', {
      type: 'truck',
      truckId,
      requestId,
      message,
      timestamp: new Date().toISOString()
    });
  });

  // Handle GPS updates
  socket.on('gps-update', (data) => {
    const { truckId, location } = data;
    
    // Broadcast to all admins and relevant users
    io.emit('gps-notification', {
      type: 'gps',
      truckId,
      location,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log(`👋 User disconnected: ${socket.id}`);
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error(`Error: ${error.message}`, { 
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// Initialize database and start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start server
    server.listen(PORT, () => {
      console.log('🚀 AutoCare Pro Backend Server Started');
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log('='.repeat(50));
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

export default app;