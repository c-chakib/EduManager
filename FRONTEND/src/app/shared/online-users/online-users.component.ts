import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';

interface OnlineUser {
  userId: string;
  nom?: string;
  prenom?: string;
  role?: string;
}

@Component({
  selector: 'app-online-users',
  imports: [CommonModule],
  templateUrl: './online-users.component.html',
  styleUrl: './online-users.component.css'
})
export class OnlineUsersComponent implements OnInit, OnDestroy {
  @Input() showChatButton = true;
  @Output() userSelected = new EventEmitter<OnlineUser>();

  onlineUsers: OnlineUser[] = [];
  currentUserId: string | null = null;
  private subscription = new Subscription();

  constructor(
    private socketService: SocketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get current user
    this.currentUserId = this.authService.getCurrentUser()?._id || null;

    // Register current user as online
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.socketService.userOnline({
        userId: currentUser._id,
        nom: currentUser.nom,
        prenom: currentUser.prenom,
        role: currentUser.role
      });
    }

    // Listen for online users updates
    this.subscription.add(
      this.socketService.onOnlineUsers().subscribe((users: OnlineUser[]) => {
        this.onlineUsers = users; // Show all users including current user
      })
    );

    // Listen for users coming online
    this.subscription.add(
      this.socketService.onUserOnline().subscribe((user: OnlineUser) => {
        if (user.userId !== this.currentUserId && !this.onlineUsers.find(u => u.userId === user.userId)) {
          this.onlineUsers.push(user);
        }
      })
    );

    // Listen for users going offline
    this.subscription.add(
      this.socketService.onUserOffline().subscribe((data: { userId: string }) => {
        this.onlineUsers = this.onlineUsers.filter(user => user.userId !== data.userId);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  selectUser(user: OnlineUser): void {
    this.userSelected.emit(user);
  }

  getUserDisplayName(user: OnlineUser): string {
    if (user.nom && user.prenom) {
      return `${user.nom} ${user.prenom}`;
    }
    return user.userId;
  }

  getUserInitials(user: OnlineUser): string {
    if (user.nom && user.prenom) {
      return `${user.nom.charAt(0)}${user.prenom.charAt(0)}`.toUpperCase();
    }
    return user.userId.substring(0, 2).toUpperCase();
  }
}
