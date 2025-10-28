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
import routerJournal from './routerJournal.js';
import aiService from './services/aiService.js';
import { authentification } from './middelware/authentification.js';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import User from './modeles/user.js';
import Message from './modeles/message.js';

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

// Add COOP and COEP headers for Google Identity Services
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

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
app.use('/uploads', express.static('uploads'));
app.use(morgan('combined'));
app.use('/etudiants', myRouter);
app.use('/users', routerUser);
app.use('/chatbot', routerChatbot);
app.use('/journal', routerJournal);

// Chat routes - admin only for clearing chat
app.delete('/chat/clear', authentification, async (req, res) => {
  try {
    // Check if user is admin or super-admin
    if (req.user?.role !== 'admin' && req.user?.role !== 'super-admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé. Permissions administrateur requises.' });
    }

    // Delete all messages from database
    const result = await Message.deleteMany({});
    
    // Emit Socket.io event to notify all clients to clear their chat
    io.emit('chatCleared', {
      clearedBy: {
        id: req.user?.userId,
        nom: req.user?.nom,
        prenom: req.user?.prenom,
        role: req.user?.role
      },
      messageCount: result.deletedCount,
      timestamp: new Date()
    });
    
    console.log(`Chat cleared by ${req.user?.nom} ${req.user?.prenom} - ${result.deletedCount} messages deleted`);
    
    res.status(200).json({
      success: true,
      message: `Chat effacé avec succès. ${result.deletedCount} messages supprimés.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'effacement du chat'
    });
  }
});

app.use(errorHandler);
app.use(NotFound);

// Centralized error handler (fallback)
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
});

dbconnect();

// Online users tracking
const onlineUsers = new Map(); // socketId -> userId

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle user authentication and online status
  socket.on('userOnline', async (userData) => {
    if (userData && userData.userId) {
      onlineUsers.set(socket.id, userData.userId);
      console.log(`User ${userData.userId} (${userData.nom} ${userData.prenom}) is now online`);

      // Broadcast to all clients that a user came online
      socket.broadcast.emit('userOnline', {
        userId: userData.userId,
        nom: userData.nom,
        prenom: userData.prenom,
        role: userData.role,
        timestamp: new Date()
      });

      // Send current online users to the newly connected user
      const onlineUsersList = await Promise.all(
        Array.from(onlineUsers.values()).map(async (userId) => {
          try {
            const user = await User.findById(userId).select('nom prenom role');
            return {
              userId: userId,
              nom: user?.nom || '',
              prenom: user?.prenom || '',
              role: user?.role || ''
            };
          } catch (error) {
            console.error('Error fetching user data:', error);
            return { userId };
          }
        })
      );
      socket.emit('onlineUsers', onlineUsersList);

      // Load and send recent chat history (last 50 messages)
      try {
        const recentMessages = await Message.find()
          .sort({ timestamp: -1 })
          .limit(50)
          .populate('senderId', 'nom prenom')
          .lean();

        // Convert to the format expected by frontend
        const chatHistory = recentMessages.reverse().map(msg => ({
          id: msg._id,
          senderId: msg.senderId._id || msg.senderId,
          senderName: msg.senderId && msg.senderId.nom && msg.senderId.prenom
            ? `${msg.senderId.prenom} ${msg.senderId.nom}`
            : msg.senderName || 'Utilisateur',
          content: msg.content,
          timestamp: msg.timestamp,
          read: msg.read
        }));

        socket.emit('chatHistory', chatHistory);
        console.log(`Sent ${chatHistory.length} messages from chat history to user ${userData.userId}`);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  });

  socket.on('disconnect', () => {
    const userId = onlineUsers.get(socket.id);
    if (userId) {
      onlineUsers.delete(socket.id);
      console.log(`User ${userId} disconnected`);

      // Broadcast to all clients that a user went offline
      socket.broadcast.emit('userOffline', {
        userId: userId,
        timestamp: new Date()
      });
    }
    console.log('User disconnected:', socket.id);
  });

  // Chat message handling - Group chat for all users
  socket.on('sendMessage', async (messageData) => {
    const senderId = onlineUsers.get(socket.id);
    if (senderId && messageData) {
      try {
        // Get sender details from database
        const sender = await User.findById(senderId).select('nom prenom');
        const senderName = sender ? `${sender.prenom} ${sender.nom}` : 'Utilisateur';

        // Save message to database
        const savedMessage = new Message({
          senderId: senderId,
          senderName: senderName,
          content: messageData.content,
          timestamp: new Date(),
          read: false,
          type: 'group'
        });

        await savedMessage.save();

        // Create message object for broadcasting
        const message = {
          id: savedMessage._id,
          senderId: senderId,
          senderName: senderName,
          content: messageData.content,
          timestamp: savedMessage.timestamp,
          read: false
        };

        // Broadcast message to ALL connected users (group chat)
        io.emit('receiveMessage', message);

        console.log(`Message saved and broadcasted: ${senderName} - ${messageData.content}`);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  });

  // Typing indicators - Group chat
  socket.on('typing', async (data) => {
    const senderId = onlineUsers.get(socket.id);
    if (senderId) {
      try {
        // Get sender details from database
        const sender = await User.findById(senderId).select('nom prenom');
        const senderName = sender ? `${sender.prenom} ${sender.nom}` : 'Utilisateur';

        // Broadcast typing status to all other users
        socket.broadcast.emit('userTyping', {
          senderId: senderId,
          senderName: senderName,
          isTyping: data.isTyping
        });
      } catch (error) {
        console.error('Error getting sender for typing:', error);
        // Fallback without name
        socket.broadcast.emit('userTyping', {
          senderId: senderId,
          senderName: 'Utilisateur',
          isTyping: data.isTyping
        });
      }
    }
  });
});

server.listen(process.env.PORT, () => 
    console.log(`Server is running on port ${process.env.PORT}`)
);
export default app;
export { io };



