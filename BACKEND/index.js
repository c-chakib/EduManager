import dotenv from 'dotenv';
dotenv.config(); // Load environment variables FIRST

import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import myRouter from './router.js';
import morgan from 'morgan';
import {dbconnect} from './modeles/DBconnect.js';
import { NotFound } from './middelware/NotFound.js';
import { errorHandler } from './middelware/StatusCode.js';
import routerUser from './routerUser.js';
import routerChatbot from './routerChatbot.js';
import aiService from './services/aiService.js';
import { authentification } from './middelware/authentification.js';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:56903', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  }
});

// CORS configuration - MUST be before helmet
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:56903', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiter - More permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 for dev, 100 for prod
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use(limiter);

// Initialize AI service after environment variables are loaded
aiService.initializeAI();

app.use (express.json());
app.use(morgan('combined'));
app.use('/etudiants', myRouter);
app.use('/users', routerUser);
app.use('/chatbot', routerChatbot);
app.use(errorHandler);
app.use(NotFound);

// Centralized error handler (fallback)
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
});

dbconnect();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(process.env.PORT, () => 
    console.log(`Server is running on port ${process.env.PORT}`)
);
export default app;
export { io };



