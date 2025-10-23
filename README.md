# 🎓 Student Management System

A full-stack web application for managing student records with real-time updates, AI-powered chatbot, and comprehensive user management.

## 🚀 Features

### Core Functionality
- ✅ **Student Management**: Complete CRUD operations for student records
- ✅ **Real-time Updates**: Socket.io integration for live data synchronization
- ✅ **User Authentication**: JWT-based authentication with role management
- ✅ **Responsive UI**: Modern Angular frontend with Tailwind CSS

### Advanced Features
- 🤖 **AI Chatbot**: Claude/OpenRouter integration for intelligent assistance
- 📊 **Dashboard Analytics**: Real-time statistics and data visualization
- 🔍 **Advanced Search & Filtering**: Multi-criteria student search
- 👥 **User Roles**: Admin, Teacher, and Student role management
- 🌐 **Guest Mode**: Public access for demonstrations
- 📱 **Mobile Responsive**: Optimized for all device sizes

## 🏗️ Architecture

### Frontend (Angular)
- **Framework**: Angular 19.2.15
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io Client
- **State Management**: RxJS Observables

### Backend (Node.js)
- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io Server
- **AI Integration**: OpenRouter API

## 📋 Prerequisites

- Node.js (v18+)
- MongoDB (v4.4+)
- npm or yarn
- Git

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/c-chakib/MODULE-5-INTEGRA-BACK-FRONT.git
cd MODULE-5-INTEGRA-BACK-FRONT
```

### 2. Backend Setup
```bash
cd BACKEND
npm install
cp .env.example .env  # Configure your environment variables
npm run db:seed:all   # Seed initial data (optional)
npm run dev           # Start development server
```

### 3. Frontend Setup
```bash
cd ../FRONTEND
npm install
npm start             # Start development server
```

## 🚀 Usage

### Development
```bash
# Backend (Terminal 1)
cd BACKEND && npm run dev

# Frontend (Terminal 2)
cd FRONTEND && npm start
```

### Production Build
```bash
# Build frontend
cd FRONTEND && npm run build

# Start backend in production
cd BACKEND && npm start
```

## 📊 API Endpoints

### Students
- `GET /etudiants` - List students (with pagination/filtering)
- `POST /etudiants` - Create student
- `PUT /etudiants/:id` - Update student
- `DELETE /etudiants/:id` - Delete student

### Authentication
- `POST /users/login` - User login
- `POST /users/register` - User registration
- `GET /users/me` - Get current user info

### Chatbot
- `POST /chatbot/responses` - Get AI response
- `GET /chatbot/responses` - Get chat history

## 🔧 Configuration

### Environment Variables (.env)
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/etudiants
JWT_SECRET=your-secret-key
OPENROUTER_API_KEY=your-api-key
NODE_ENV=development
```

## 🧪 Testing

### Backend Tests
```bash
cd BACKEND
npm test
```

### Database Management
```bash
# Seed demo data
npm run db:seed

# Diagnose database issues
npm run db:diagnose

# Remove duplicates
npm run db:dedupe
```

## 📁 Project Structure

```
├── BACKEND/                 # Node.js/Express server
│   ├── controler/          # Route controllers
│   ├── modeles/            # MongoDB models
│   ├── middelware/         # Custom middleware
│   ├── router.js           # Main routes
│   ├── test/               # Unit tests
│   └── scripts/            # Database utilities
├── FRONTEND/               # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── etudiants/  # Student management
│   │   │   ├── auth/       # Authentication
│   │   │   ├── services/   # Angular services
│   │   │   └── guards/     # Route guards
│   └── public/             # Static assets
├── docs/                   # Documentation
└── README.md              # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Chakib C.** - [GitHub](https://github.com/c-chakib)

## 🙏 Acknowledgments

- Angular Team for the amazing framework
- Socket.io for real-time communication
- OpenRouter for AI integration
- MongoDB for the database
- Tailwind CSS for styling

---

⭐ **Star this repo if you found it helpful!**</content>
<parameter name="filePath">c:\Users\DELL\Desktop\JOBINTECH\MODULE 5 INTEGRA BACK FRONT\README.md