import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoggerService } from '../../core/services/logger.service';
import { ChatbotService } from '../services/chatbot.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface Message {
  text: string;
  isBot: boolean;
  timestamp: Date;
  suggestions?: QuickReply[];  // Add clickable suggestions to messages
}

interface QuickReply {
  text: string;
  value: string;
}

interface ChatbotResponse {
  topic: string;
  answer: string;
  keywords: string[];
  suggestions: QuickReply[];
}

@Component({
  selector: 'app-chatbot',
  standalone: false,
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.css'
})
export class ChatbotComponent implements OnInit, OnDestroy {
  isOpen = false;
  isMinimized = false;
  messages: Message[] = [];
  userInput = '';
  isTyping = false;
  private chatSubscription?: Subscription;
  private readonly chatbotApiUrl = `${environment.apiUrl}/chatbot`;
  private responsesCache: ChatbotResponse[] = [];
  private useAI = true; // Toggle between AI and simple keyword matching
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(
    private chatbotService: ChatbotService,
    private http: HttpClient,
    private logger: LoggerService
  ) {
    // Load chatbot responses from backend
    this.loadChatbotResponses();
  }

  async loadChatbotResponses(): Promise<void> {
    try {
      this.responsesCache = await this.http.get<ChatbotResponse[]>(`${this.chatbotApiUrl}/responses`).toPromise() || [];
      
      // Add welcome message after loading responses
      const defaultResponse = this.responsesCache.find(r => r.topic === 'greeting');
      this.messages.push({
        text: defaultResponse?.answer || 'Bonjour! 👋 Je suis votre assistant EduManager. Comment puis-je vous aider aujourd\'hui?',
        isBot: true,
        timestamp: new Date(),
        suggestions: defaultResponse?.suggestions || []
      });
    } catch (error) {
      this.logger.error('Error loading chatbot responses:', error);
      // Fallback welcome message
      this.messages.push({
        text: 'Bonjour! 👋 Je suis votre assistant EduManager. Comment puis-je vous aider aujourd\'hui?',
        isBot: true,
        timestamp: new Date(),
        suggestions: []
      });
    }
  }

  ngOnInit(): void {
    // Subscribe to chat open events from the service
    this.chatSubscription = this.chatbotService.chatOpen$.subscribe(shouldOpen => {
      if (shouldOpen && !this.isOpen) {
        this.toggleChat();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.isMinimized = false;
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  minimizeChat(): void {
    this.isMinimized = !this.isMinimized;
  }

  closeChat(): void {
    this.isOpen = false;
    this.isMinimized = false;
  }

  async sendMessage(): Promise<void> {
    if (!this.userInput.trim()) return;

    const userMessage = this.userInput;
    
    // Add user message to chat
    this.messages.push({
      text: userMessage,
      isBot: false,
      timestamp: new Date()
    });

    // Add to conversation history for AI context
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    this.userInput = '';
    this.isTyping = true;
    this.scrollToBottom();

    // Get response from AI or fallback
    setTimeout(async () => {
      try {
        let responseData;

        if (this.useAI) {
          // Try AI-powered response first
          responseData = await this.getAIResponse(userMessage);
        } else {
          // Use simple keyword matching
          responseData = await this.getBotResponseWithTopic(userMessage);
        }
        
        this.isTyping = false;
        
        // Add bot response to chat
        this.messages.push({
          text: responseData.answer || responseData.text,
          isBot: true,
          timestamp: new Date(),
          suggestions: responseData.suggestions || []
        });

        // Add to conversation history
        this.conversationHistory.push({
          role: 'assistant',
          content: responseData.answer || responseData.text
        });

        // Keep conversation history manageable (last 20 messages)
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }

        this.scrollToBottom();
      } catch (error) {
        this.logger.error('Error getting response:', error);
        this.isTyping = false;
        this.messages.push({
          text: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
          isBot: true,
          timestamp: new Date(),
          suggestions: []
        });
        this.scrollToBottom();
      }
    }, 800);
  }

  // Get AI-powered response
  async getAIResponse(message: string): Promise<any> {
    try {
      const response = await this.http.post<any>(`${this.chatbotApiUrl}/ai`, {
        message: message,
        conversationHistory: this.conversationHistory
      }).toPromise();

      return {
        answer: response.answer,
        suggestions: response.suggestions || [],
        source: response.source
      };
    } catch (error) {
      this.logger.warn('AI response failed, using fallback:', error);
      // Fallback to simple search
      this.useAI = false;
      return await this.getBotResponseWithTopic(message);
    }
  }

  async sendQuickReply(reply: QuickReply): Promise<void> {
    // Add user message
    this.messages.push({
      text: reply.text,
      isBot: false,
      timestamp: new Date()
    });

    // Show typing indicator
    this.isTyping = true;
    this.scrollToBottom();

    // Get response from backend
    try {
      const response = await this.http.get<ChatbotResponse>(`${this.chatbotApiUrl}/responses/${reply.value}`).toPromise();
      
      this.isTyping = false;
      this.messages.push({
        text: response?.answer || 'Désolé, je n\'ai pas compris.',
        isBot: true,
        timestamp: new Date(),
        suggestions: response?.suggestions || []
      });

      this.scrollToBottom();
    } catch (error) {
      console.error('Error fetching chatbot response:', error);
      this.isTyping = false;
      this.messages.push({
        text: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
        isBot: true,
        timestamp: new Date(),
        suggestions: []
      });
      this.scrollToBottom();
    }
  }

  async getBotResponseWithTopic(input: string): Promise<{ text: string; suggestions: QuickReply[] }> {
    try {
      // Use backend search API
      const response = await this.http.get<ChatbotResponse>(`${this.chatbotApiUrl}/search`, {
        params: { keyword: input }
      }).toPromise();

      return {
        text: response?.answer || 'Je suis désolé, je n\'ai pas compris votre question. Pouvez-vous reformuler?',
        suggestions: response?.suggestions || []
      };
    } catch (error) {
      console.error('Error searching chatbot response:', error);
      return {
        text: 'Désolé, une erreur s\'est produite. Pouvez-vous reformuler votre question?',
        suggestions: []
      };
    }
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.chat-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
