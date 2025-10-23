import ChatbotResponse from '../modeles/chatbot.js';
import aiService from '../services/aiService.js';

// Get AI service status
export const getAIStatus = async (req, res, next) => {
  try {
    const status = aiService.getStatus();
    res.status(200).json(status);
  } catch (error) {
    console.error('Error fetching AI status:', error);
    res.status(500).json({ message: 'Error fetching AI status', error: error.message });
  }
};

// Get AI-powered response (intelligent chatbot)
export const getAIResponse = async (req, res, next) => {
  try {
    const { message, conversationHistory } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get response from AI service (with automatic fallback)
    const response = await aiService.getResponse(
      message,
      conversationHistory || []
    );

    res.status(200).json(response);
  } catch (error) {
    console.error('Error getting AI response:', error);
    res.status(500).json({ message: 'Error getting AI response', error: error.message });
  }
};

// Get all chatbot responses
export const getAllResponses = async (req, res, next) => {
  try {
    const responses = await ChatbotResponse.find({});
    res.status(200).json(responses);
  } catch (error) {
    console.error('Error fetching chatbot responses:', error);
    res.status(500).json({ message: 'Error fetching chatbot responses', error: error.message });
  }
};

// Get response by topic
export const getResponseByTopic = async (req, res, next) => {
  try {
    const { topic } = req.params;
    const response = await ChatbotResponse.findOne({ topic });
    
    if (!response) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching chatbot response by topic:', error);
    res.status(500).json({ message: 'Error fetching chatbot response', error: error.message });
  }
};

// Search responses by keyword
export const searchByKeyword = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    
    if (!keyword) {
      return res.status(400).json({ message: 'Keyword is required' });
    }
    
    // Search in keywords array or answer text
    const responses = await ChatbotResponse.find({
      $or: [
        { keywords: { $regex: keyword, $options: 'i' } },
        { answer: { $regex: keyword, $options: 'i' } }
      ]
    });
    
    // Return the first match or default
    if (responses.length > 0) {
      res.status(200).json(responses[0]);
    } else {
      // Return default response if no match
      const defaultResponse = await ChatbotResponse.findOne({ topic: 'default' });
      res.status(200).json(defaultResponse || { topic: 'default', answer: 'Je suis désolé, je n\'ai pas compris votre question.' });
    }
  } catch (error) {
    console.error('Error searching chatbot responses:', error);
    res.status(500).json({ message: 'Error searching chatbot responses', error: error.message });
  }
};

// Seed initial data (for development)
export const seedChatbotData = async (req, res, next) => {
  try {
    const initialData = [
      {
        topic: 'add_student',
        answer: 'Pour ajouter un étudiant, suivez ces étapes:\n\n1. Connectez-vous à votre compte\n2. Accédez à la section "Étudiants"\n3. Cliquez sur "Ajouter un étudiant"\n4. Remplissez le formulaire avec les informations requises (nom, prénom, email, filière)\n5. Cliquez sur "Enregistrer"\n\nVous pouvez également consulter notre guide détaillé dans la section Documentation.',
        keywords: ['ajouter', 'créer', 'nouveau', 'étudiant', 'inscription', 'enregistrer'],
        suggestions: [
          { text: '📊 Comment voir les stats?', value: 'stats' },
          { text: '❓ Autres questions', value: 'faq' },
          { text: '🏠 Menu principal', value: 'default' }
        ]
      },
      {
        topic: 'stats',
        answer: 'Pour consulter les statistiques:\n\n1. Accédez au menu principal\n2. Cliquez sur "Statistiques"\n3. Vous verrez des graphiques interactifs montrant:\n   - Nombre total d\'étudiants\n   - Répartition par filière\n   - Évolution des inscriptions\n   - Performances académiques\n\nNote: Seuls les administrateurs ont accès aux statistiques complètes.',
        keywords: ['statistiques', 'stats', 'graphiques', 'données', 'analytics', 'chiffres'],
        suggestions: [
          { text: '📚 Ajouter un étudiant', value: 'add_student' },
          { text: '❓ Questions fréquentes', value: 'faq' },
          { text: '🏠 Menu principal', value: 'default' }
        ]
      },
      {
        topic: 'faq',
        answer: 'Voici les questions les plus fréquentes:\n\n• Comment réinitialiser mon mot de passe ?\n• Comment importer des données en masse ?\n• Comment exporter les données ?\n• Quels formats de fichiers sont supportés ?\n\nPour plus de détails, consultez notre page FAQ complète.',
        keywords: ['faq', 'questions', 'aide', 'help', 'comment', 'pourquoi'],
        suggestions: [
          { text: '📚 Ajouter un étudiant', value: 'add_student' },
          { text: '📊 Voir les statistiques', value: 'stats' },
          { text: '📞 Contacter le support', value: 'support' },
          { text: '🏠 Menu principal', value: 'default' }
        ]
      },
      {
        topic: 'support',
        answer: 'Nous sommes là pour vous aider! Contactez-nous via:\n\n📧 Email: contact@edumanager.com\n📞 Téléphone: +212 662 12 7709\n⏰ Horaires: Lun-Ven 9h-18h\n\nVous pouvez également soumettre un ticket depuis la page Support.',
        keywords: ['support', 'aide', 'contact', 'assistance', 'help', 'problème'],
        suggestions: [
          { text: '❓ Questions fréquentes', value: 'faq' },
          { text: '📚 Ajouter un étudiant', value: 'add_student' },
          { text: '🏠 Menu principal', value: 'default' }
        ]
      },
      {
        topic: 'default',
        answer: 'Je suis votre assistant virtuel EduManager! Je peux vous aider avec:\n\n• La gestion des étudiants\n• Les fonctionnalités de la plateforme\n• Les questions techniques\n• Les informations de contact\n\nQue puis-je faire pour vous aujourd\'hui?',
        keywords: ['default', 'aide', 'bonjour', 'hello', 'hi'],
        suggestions: [
          { text: '📚 Ajouter un étudiant', value: 'add_student' },
          { text: '📊 Voir les statistiques', value: 'stats' },
          { text: '❓ Questions fréquentes', value: 'faq' },
          { text: '📞 Contacter le support', value: 'support' }
        ]
      },
      {
        topic: 'greeting',
        answer: 'Bonjour! Comment puis-je vous assister aujourd\'hui? 😊',
        keywords: ['bonjour', 'salut', 'hello', 'hi', 'hey'],
        suggestions: [
          { text: '📚 Ajouter un étudiant', value: 'add_student' },
          { text: '📊 Statistiques', value: 'stats' },
          { text: '❓ FAQ', value: 'faq' },
          { text: '📞 Support', value: 'support' }
        ]
      },
      {
        topic: 'thanks',
        answer: 'Avec plaisir! N\'hésitez pas si vous avez d\'autres questions. 😊',
        keywords: ['merci', 'thanks', 'thank you', 'super', 'parfait'],
        suggestions: [
          { text: '📚 Ajouter un étudiant', value: 'add_student' },
          { text: '📊 Statistiques', value: 'stats' },
          { text: '🏠 Menu principal', value: 'default' }
        ]
      },
      {
        topic: 'goodbye',
        answer: 'Au revoir! À bientôt sur EduManager. 👋',
        keywords: ['au revoir', 'bye', 'goodbye', 'à bientôt', 'salut'],
        suggestions: [
          { text: '🏠 Menu principal', value: 'default' }
        ]
      }
    ];

    // Upsert each item so updates (like contact info) propagate even if data exists
    let upserted = 0;
    for (const item of initialData) {
      const result = await ChatbotResponse.updateOne(
        { topic: item.topic },
        { $set: item },
        { upsert: true }
      );
      // Count upserts or modifications
      if (result.upsertedCount > 0 || result.modifiedCount > 0) {
        upserted += 1;
      }
    }

    const finalCount = await ChatbotResponse.countDocuments();
    res.status(201).json({ 
      message: 'Chatbot data seeded/updated successfully', 
      upserted,
      total: finalCount
    });
  } catch (error) {
    console.error('Error seeding chatbot data:', error);
    res.status(500).json({ message: 'Error seeding chatbot data', error: error.message });
  }
};
