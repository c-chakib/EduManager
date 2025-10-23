import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private chatOpenSubject = new BehaviorSubject<boolean>(false);
  public chatOpen$: Observable<boolean> = this.chatOpenSubject.asObservable();

  constructor() { }

  openChat(): void {
    this.chatOpenSubject.next(true);
  }

  closeChat(): void {
    this.chatOpenSubject.next(false);
  }

  toggleChat(): void {
    this.chatOpenSubject.next(!this.chatOpenSubject.value);
  }
}
