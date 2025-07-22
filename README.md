# AutoCare Pro - Premium Car Management System

A modern, responsive car service management system built with React, featuring real-time tracking, automated reminders, and comprehensive admin controls.

![AutoCare Pro](https://images.unsplash.com/photo-1681757919215-dce9022de95d?w=800&h=400&fit=crop)

## 🚀 Features

### For Users
- **Service Request Management** - Submit brake repairs, routine maintenance, and specialized services
- **Real-time Tracking** - Track your service requests from submission to completion
- **Vehicle Management** - Add and manage multiple vehicles
- **Service History** - Complete history of all your services
- **Notifications** - Get notified about service status updates
- **Modern UI** - Beautiful, responsive design with smooth animations

### For Administrators
- **Request Management** - Approve, reject, and track all service requests
- **Status Updates** - Update service progress in real-time
- **User Management** - Manage customer accounts and service history
- **Analytics Dashboard** - View statistics and system overview
- **Messaging System** - Communicate with customers

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS, Radix UI
- **Animations**: Framer Motion
- **State Management**: React Context API
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd autocare-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## 🚀 Quick Start

1. Open your browser and navigate to `http://localhost:5173`
2. Register a new account or use these demo credentials:
   - **Admin**: `admin@autocare.com` / any password
   - **User**: `user@example.com` / any password

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── user/           # User-specific components
│   └── ui/             # Base UI components (buttons, cards, etc.)
├── contexts/           # React Context providers
│   ├── AuthContext.jsx
│   ├── ServiceContext.jsx
│   └── MessageContext.jsx
├── pages/              # Page components
├── lib/                # Utility functions
└── index.css          # Global styles and theme
```

## 🎨 Design System

The application uses a modern dark theme with red accents:
- **Primary Color**: Red (#ef4444)
- **Background**: Dark gradient
- **Typography**: Inter font family
- **Components**: Glass morphism effects with subtle animations

## 🔐 Authentication

Current implementation uses localStorage for demo purposes. In production, this should be replaced with:
- JWT tokens
- Secure HTTP-only cookies
- OAuth integration
- Session management

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🧪 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (if configured)

## 🔮 Future Enhancements

### Backend Integration
- [ ] Node.js/Express server
- [ ] MongoDB/PostgreSQL database
- [ ] RESTful API endpoints
- [ ] Real-time WebSocket connections

### Security
- [ ] JWT authentication
- [ ] Input validation
- [ ] CORS configuration
- [ ] Rate limiting

### Features
- [ ] File uploads for vehicle photos
- [ ] Email/SMS notifications
- [ ] Payment integration
- [ ] Calendar appointments
- [ ] Multi-language support

### Testing
- [ ] Unit tests with Vitest
- [ ] Integration tests
- [ ] E2E tests with Playwright
- [ ] Performance testing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed description
3. Include your environment details and steps to reproduce

## 🙏 Acknowledgments

- [Unsplash](https://unsplash.com) for high-quality images
- [Lucide](https://lucide.dev) for beautiful icons
- [Radix UI](https://radix-ui.com) for accessible components
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling

---

**Made with ❤️ for the automotive service industry**