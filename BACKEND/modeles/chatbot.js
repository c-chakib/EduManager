import mongoose from 'mongoose';

const chatbotResponseSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
    unique: true,
    enum: ['add_student', 'stats', 'faq', 'support', 'default', 'greeting', 'thanks', 'goodbye']
  },
  answer: {
    type: String,
    required: true
  },
  keywords: [{
    type: String
  }],
  suggestions: [{
    text: String,
    value: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
chatbotResponseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const ChatbotResponse = mongoose.model('ChatbotResponse', chatbotResponseSchema);

export default ChatbotResponse;
