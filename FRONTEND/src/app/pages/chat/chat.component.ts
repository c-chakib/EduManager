import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OnlineUsersComponent } from '../../shared/online-users/online-users.component';
import { ChatComponent } from '../../shared/chat/chat.component';

@Component({
  selector: 'app-chat-page',
  imports: [CommonModule, OnlineUsersComponent, ChatComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatPageComponent {
  // Group chat - no individual user selection needed
}
