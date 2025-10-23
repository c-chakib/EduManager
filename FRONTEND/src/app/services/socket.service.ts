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

  disconnect() {
    this.socket.disconnect();
  }

}