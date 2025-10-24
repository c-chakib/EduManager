import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: any;

  constructor() {
    this.socket = io('http://localhost:3000');
    this.socket.on('connect', () => {
      console.log('[Socket.io] Connected:', this.socket.id);
    });
    this.socket.on('disconnect', (reason: any) => {
      console.warn('[Socket.io] Disconnected:', reason);
    });
    this.socket.on('connect_error', (error: any) => {
      console.error('[Socket.io] Connection error:', error);
    });

    // Debug: Listen to all events
    this.socket.onAny((event: string, ...args: any[]) => {
      console.log('[Socket.io] Received event:', event, args);
    });
  }

  onStudentCreated(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('studentCreated', (data: any) => observer.next(data));
    });
  }

  onStudentUpdated(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('studentUpdated', (data: any) => observer.next(data));
    });
  }

  onStudentDeleted(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('studentDeleted', (data: any) => observer.next(data));
    });
  }

  onUserCreated(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('userCreated', (data: any) => observer.next(data));
    });
  }

  onUserUpdated(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('userUpdated', (data: any) => observer.next(data));
    });
  }

  onUserDeleted(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('userDeleted', (data: any) => observer.next(data));
    });
  }

  onUserApproved(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('userApproved', (data: any) => observer.next(data));
    });
  }

  onUserRejected(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('userRejected', (data: any) => observer.next(data));
    });
  }

  // Online users and chat methods
  userOnline(userData: any): void {
    this.socket.emit('userOnline', userData);
  }

  onUserOnline(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('userOnline', (data: any) => observer.next(data));
    });
  }

  onUserOffline(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('userOffline', (data: any) => observer.next(data));
    });
  }

  onOnlineUsers(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('onlineUsers', (data: any) => observer.next(data));
    });
  }

  sendMessage(messageData: any): void {
    this.socket.emit('sendMessage', messageData);
  }

  onReceiveMessage(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('receiveMessage', (data: any) => observer.next(data));
    });
  }

  onMessageSent(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('messageSent', (data: any) => observer.next(data));
    });
  }

  onChatHistory(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('chatHistory', (data: any) => observer.next(data));
    });
  }

  sendTyping(data: any): void {
    this.socket.emit('typing', data);
  }

  onUserTyping(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('userTyping', (data: any) => observer.next(data));
    });
  }

}