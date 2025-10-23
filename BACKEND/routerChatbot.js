import { Router } from 'express';
import { 
  getAllResponses, 
  getResponseByTopic, 
  searchByKeyword, 
  seedChatbotData,
  getAIResponse,
  getAIStatus 
} from './controler/controlerChatbot.js';

const routerChatbot = Router();

// AI-powered chatbot routes
routerChatbot.post('/ai', getAIResponse);        // Intelligent AI responses
routerChatbot.get('/ai/status', getAIStatus);    // Check AI availability

// Public routes - no authentication required for chatbot
routerChatbot.get('/responses', getAllResponses);
routerChatbot.get('/responses/:topic', getResponseByTopic);
routerChatbot.get('/search', searchByKeyword);

// Seed route - for initial setup (can be protected later)
routerChatbot.post('/seed', seedChatbotData);

export default routerChatbot;
