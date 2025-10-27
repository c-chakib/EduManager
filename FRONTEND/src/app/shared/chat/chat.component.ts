import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

interface ChatMessage {
  id: number;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  messages: ChatMessage[] = [];
  newMessage = '';
  currentUserId: string | null = null;
  currentUserRole: string | null = null;
  isTyping = false;
  otherUserTyping = false;
  typingUserName = '';
  private subscription = new Subscription();
  private typingTimeout: any;

  constructor(
    private socketService: SocketService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser?._id || null;
    this.currentUserRole = currentUser?.role || null;

    // Load chat history when connecting
    this.subscription.add(
      this.socketService.onChatHistory().subscribe((chatHistory: ChatMessage[]) => {
        this.messages = chatHistory;
        this.scrollToBottom();
        console.log(`Loaded ${chatHistory.length} messages from chat history`);
      })
    );

    // Listen for incoming messages (group chat - all messages including own)
    this.subscription.add(
      this.socketService.onReceiveMessage().subscribe((message: ChatMessage) => {
        this.messages.push(message);
        this.scrollToBottom();
      })
    );

    // Listen for typing indicators (group chat)
    this.subscription.add(
      this.socketService.onUserTyping().subscribe((data: any) => {
        this.otherUserTyping = data.isTyping;
        if (data.isTyping) {
          // Use the sender name from the backend
          this.typingUserName = data.senderName || 'Utilisateur';
          this.scrollToBottom();
        } else {
          this.typingUserName = '';
        }
      })
    );

    // Listen for chat cleared event
    this.subscription.add(
      this.socketService.onChatCleared().subscribe((data: any) => {
        console.log('[Chat] Received chatCleared event:', data);
        this.messages = []; // Clear local messages
        // Optionally show a notification
        alert(`Chat effacé par ${data.clearedBy.prenom} ${data.clearedBy.nom} (${data.messageCount} messages supprimés)`);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const messageData = {
      content: this.newMessage.trim()
    };

    this.socketService.sendMessage(messageData);
    this.newMessage = '';
    this.stopTyping();
  }

  onTyping(): void {
    if (!this.isTyping) {
      this.isTyping = true;
      this.socketService.sendTyping({
        isTyping: true
      });
    }

    // Clear previous timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Set new timeout to stop typing indicator
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 1000);
  }

  stopTyping(): void {
    if (this.isTyping) {
      this.isTyping = false;
      this.socketService.sendTyping({
        isTyping: false
      });
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  isMyMessage(message: ChatMessage): boolean {
    return message.senderId === this.currentUserId;
  }

  isAdmin(): boolean {
    return this.currentUserRole === 'admin' || this.currentUserRole === 'super-admin';
  }

  formatTime(date: Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
