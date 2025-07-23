# AutoCare Pro Backend

Simple Node.js backend for the AutoCare Pro application.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Services
- `GET /api/services` - Get all service requests
- `POST /api/services` - Create service request
- `PUT /api/services/:id` - Update service request
- `DELETE /api/services/:id` - Delete service request

### Messages
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `GET /api/messages/conversations` - Get conversations
- `PUT /api/messages/:id/read` - Mark message as read

## Features

- SQLite database for data persistence
- JWT authentication
- Real-time messaging with Socket.IO
- SMS notifications with Africa's Talking
- Rate limiting and security features

## Environment Variables

Create a `.env` file:

```
JWT_SECRET=your-secret-key
AFRICAS_TALKING_USERNAME=your-username
AFRICAS_TALKING_API_KEY=your-api-key
PORT=5000
```

## Database

The SQLite database is automatically created and initialized on first run.