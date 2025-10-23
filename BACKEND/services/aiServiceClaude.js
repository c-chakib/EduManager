import Anthropic from '@anthropic-ai/sdk';
import ChatbotResponse from '../modeles/chatbot.js';

class AIService {
  constructor() {
    this.anthropic = null;
    this.isConfigured = false;
  }

  initializeAI() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('🔍 Debug - Claude API Key present:', !!apiKey, 'Length:', apiKey?.length || 0);
    
    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      console.warn('⚠️  Anthropic (Claude) API key not configured. AI features will be disabled.');
      console.warn('   Add ANTHROPIC_API_KEY to your .env file to enable AI chatbot.');
      this.isConfigured = false;
      return;
    }

    try {
      this.anthropic = new Anthropic({
        apiKey: apiKey
      });
      this.isConfigured = true;
      console.log('✅ Claude AI initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Claude:', error.message);
      this.isConfigured = false;
    }
  }

  // System prompt that defines the chatbot's personality and context
  getSystemPrompt() {
    return `Tu es un assistant virtuel intelligent pour EduManager, une plateforme de gestion éducative.

CONTEXTE:
- EduManager est une application web pour gérer les étudiants, leurs notes, et leurs informations
- L'application permet d'ajouter, modifier, supprimer et consulter les étudiants
- Elle offre des statistiques et des graphiques sur les performances
- Il y a deux types d'utilisateurs: administrateurs (gestion complète) et utilisateurs (consultation)

TES CAPACITÉS:
- Répondre aux questions sur l'utilisation de la plateforme
- Guider les utilisateurs dans les différentes fonctionnalités
- Expliquer comment ajouter/modifier/supprimer des étudiants
- Aider avec les statistiques et les rapports
- Résoudre les problèmes techniques courants
- Fournir des informations de contact du support

STYLE DE RÉPONSE:
- Sois amical, professionnel et utile
- Utilise des émojis quand approprié (📚 📊 ✅ ❓ etc.)
- Donne des réponses concises mais complètes
- Structure les réponses avec des listes à puces ou des étapes numérotées
- Réponds toujours en français
- Si tu ne sais pas quelque chose, dis-le honnêtement et suggère de contacter le support

INFORMATIONS DE CONTACT:
- Email: contact@edumanager.com
- Téléphone: +212 662 12 7709
- Horaires: Lun-Ven 9h-18h`;
  }

  // Convert conversation history to Claude format
  formatConversationHistory(conversationHistory) {
    // Claude expects alternating user/assistant messages
    const formattedMessages = [];
    
    for (const msg of conversationHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        formattedMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }
    
    return formattedMessages;
  }

  // Get AI-powered response with context awareness
  async getAIResponse(userMessage, conversationHistory = []) {
    if (!this.isConfigured) {
      throw new Error('Claude API is not configured');
    }

    try {
      // Format conversation history for Claude
      const messages = this.formatConversationHistory(conversationHistory);
      
      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage
      });

      // Call Claude API
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022', // Latest Claude model (fast & intelligent)
        // Alternative models:
        // 'claude-3-5-haiku-20241022' - Fastest, cheapest
        // 'claude-3-opus-20240229' - Most powerful, expensive
        max_tokens: 1024,
        temperature: 0.7,
        system: this.getSystemPrompt(), // Claude uses separate system parameter
        messages: messages
      });

      // Extract the text response
      const aiResponse = response.content[0].text;

      // Generate contextual suggestions
      const suggestions = await this.generateSuggestions(userMessage, aiResponse);

      return {
        answer: aiResponse,
        suggestions: suggestions,
        source: 'ai',
        model: 'claude-3-5-sonnet',
        provider: 'anthropic'
      };

    } catch (error) {
      console.error('Claude API Error:', error.message);
      if (error.status) {
        console.error('Status:', error.status);
      }
      if (error.error) {
        console.error('Error details:', error.error);
      }
      throw error;
    }
  }

  // Generate contextual suggestions based on user message and AI response
  async generateSuggestions(userMessage, aiResponse) {
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();

    // Smart suggestion generation based on keywords
    const suggestionMap = {
      'ajouter': [
        { text: '📊 Voir les statistiques', value: 'stats' },
        { text: '❓ Questions fréquentes', value: 'faq' }
      ],
      'statistique': [
        { text: '📚 Ajouter un étudiant', value: 'add_student' },
        { text: '❓ Questions fréquentes', value: 'faq' }
      ],
      'support': [
        { text: '❓ Questions fréquentes', value: 'faq' },
        { text: '📚 Ajouter un étudiant', value: 'add_student' }
      ],
      'problème': [
        { text: '📞 Contacter le support', value: 'support' },
        { text: '❓ Questions fréquentes', value: 'faq' }
      ]
    };

    // Find relevant suggestions
    for (const [keyword, suggestions] of Object.entries(suggestionMap)) {
      if (lowerMessage.includes(keyword) || lowerResponse.includes(keyword)) {
        return suggestions;
      }
    }

    // Default suggestions
    return [
      { text: '📚 Ajouter un étudiant', value: 'add_student' },
      { text: '📊 Statistiques', value: 'stats' },
      { text: '📞 Support', value: 'support' }
    ];
  }

  // Fallback to MongoDB responses when AI is not available
  async getFallbackResponse(userMessage) {
    try {
      // Search in MongoDB
      const response = await ChatbotResponse.findOne({
        $or: [
          { keywords: { $regex: userMessage, $options: 'i' } },
          { answer: { $regex: userMessage, $options: 'i' } }
        ]
      });

      if (response) {
        return {
          answer: response.answer,
          suggestions: response.suggestions,
          source: 'database',
          topic: response.topic
        };
      }

      // Ultimate fallback
      const defaultResponse = await ChatbotResponse.findOne({ topic: 'default' });
      return {
        answer: defaultResponse?.answer || 'Je suis désolé, je n\'ai pas compris votre question. Pouvez-vous reformuler?',
        suggestions: defaultResponse?.suggestions || [],
        source: 'database',
        topic: 'default'
      };

    } catch (error) {
      console.error('Fallback response error:', error.message);
      return {
        answer: 'Une erreur s\'est produite. Veuillez contacter le support.',
        suggestions: [{ text: '📞 Contacter le support', value: 'support' }],
        source: 'error'
      };
    }
  }

  // Get response with automatic fallback
  async getResponse(userMessage, conversationHistory = []) {
    // Try AI first if configured
    if (this.isConfigured) {
      try {
        return await this.getAIResponse(userMessage, conversationHistory);
      } catch (error) {
        console.warn('AI response failed, falling back to database:', error.message);
      }
    }

    // Fallback to database
    return await this.getFallbackResponse(userMessage);
  }

  // Check if AI is available
  isAIAvailable() {
    return this.isConfigured;
  }

  // Get API usage info (for monitoring)
  getStatus() {
    return {
      configured: this.isConfigured,
      provider: this.isConfigured ? 'Anthropic (Claude)' : 'None',
      model: this.isConfigured ? 'claude-3-5-sonnet' : 'N/A',
      fallback: 'MongoDB'
    };
  }
}

// Singleton instance
const aiService = new AIService();

export default aiService;
