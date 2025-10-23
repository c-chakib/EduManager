import OpenAI from 'openai';
import ChatbotResponse from '../modeles/chatbot.js';

class AIService {
  constructor() {
    this.client = null;
    this.isConfigured = false;
    this.model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
  }

  initializeAI() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const siteUrl = process.env.OPENROUTER_SITE_URL || 'http://localhost:3000';

    console.log('🔍 Debug - OpenRouter API Key present:', !!apiKey, 'Length:', apiKey?.length || 0);
    
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      console.warn('⚠️  OpenRouter API key not configured. AI features will be disabled.');
      console.warn('   Add OPENROUTER_API_KEY to your .env file to enable AI chatbot.');
      this.isConfigured = false;
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey,
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': siteUrl,
          'X-Title': 'EduManager Chatbot'
        }
      });
      this.isConfigured = true;
      console.log('✅ OpenRouter AI initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OpenRouter:', error.message);
      this.isConfigured = false;
    }
  }

  // System prompt that defines the chatbot's personality and context
  getSystemPrompt() {
    return `Tu es un assistant virtuel intelligent pour EduManager, une plateforme de gestion éducative.

IMPORTANT :
- Toutes les informations de contact doivent utiliser le numéro marocain officiel : +212 662 12 77 09
- N'utilise jamais d'autres numéros (ex : +33, +212 662 12 7709, etc.)
- Ne mentionne jamais la France, ni aucun numéro français
- Le support est basé au Maroc

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
- Téléphone: +212 662 12 77 09
- Horaires: Lun-Ven 9h-18h`;
  }

  // Normalize conversation history for OpenAI-compatible format
  formatConversationHistory(conversationHistory) {
    const formatted = [];
    for (const msg of conversationHistory || []) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        formatted.push({ role: msg.role, content: msg.content });
      }
    }
    return formatted;
  }

  // Get AI-powered response with context awareness (OpenRouter)
  async getAIResponse(userMessage, conversationHistory = []) {
    if (!this.isConfigured) {
      throw new Error('OpenRouter API is not configured');
    }

    try {
      const messages = [
        { role: 'system', content: this.getSystemPrompt() },
        ...this.formatConversationHistory(conversationHistory),
        { role: 'user', content: userMessage }
      ];

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 1024,
        temperature: 0.7
      });

      const aiResponse = response.choices?.[0]?.message?.content || '';
      const suggestions = await this.generateSuggestions(userMessage, aiResponse);

      return {
        answer: aiResponse,
        suggestions,
        source: 'ai',
        model: this.model,
        provider: 'openrouter'
      };

    } catch (error) {
      console.error('OpenRouter API Error:', error.message);
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
      provider: this.isConfigured ? 'OpenRouter' : 'None',
      model: this.isConfigured ? this.model : 'N/A',
      fallback: 'MongoDB'
    };
  }
}

// Singleton instance
const aiService = new AIService();

export default aiService;
