
import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Observable, Subscription } from 'rxjs';
import { LoggerService } from '../../core/services/logger.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  encapsulation: ViewEncapsulation.Emulated // Force l'encapsulation pour éviter les conflits
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isAuthenticated$: Observable<boolean>;
  currentUser$: Observable<User | null>;
  private subscription = new Subscription();
  pendingCount = 0;
  userNotifCount = 0;
  userNotifDetails: Array<{action: string, user: string, time: Date, details: any}> = [];
  notifDropdownOpen = false;

  constructor(
    private router: Router,
    public authService: AuthService,
    private logger: LoggerService,
    private socketService: SocketService
  ) {
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Souscrire aux changements d'état d'authentification
    this.subscription.add(
      this.isAuthenticated$.subscribe(isAuth => {
        this.logger.debug('🔐 État d\'authentification:', isAuth);
        if (isAuth && this.isSuperAdmin()) {
          this.loadPendingCount();
        }
      })
    );

    // Listen for pending users changes (approvals/rejections)
    this.subscription.add(
      this.authService.pendingUsersChanged$.subscribe(() => {
        if (this.isSuperAdmin()) {
          this.loadPendingCount();
        }
      })
    );

    // Listen for user edit/delete/update events for superadmin notification
    if (this.isSuperAdmin()) {
      this.subscription.add(this.socketService.onUserCreated().subscribe((data: any) => this.addUserNotif('Création utilisateur', data)));
      this.subscription.add(this.socketService.onUserUpdated().subscribe((data: any) => this.addUserNotif('Modification utilisateur', data)));
      this.subscription.add(this.socketService.onUserDeleted().subscribe((data: any) => this.addUserNotif('Suppression utilisateur', data)));
      this.subscription.add(this.socketService.onUserApproved().subscribe((data: any) => this.addUserNotif('Approbation utilisateur', data)));
      this.subscription.add(this.socketService.onUserRejected().subscribe((data: any) => this.addUserNotif('Rejet utilisateur', data)));
    }
  }

  addUserNotif(action: string, data: any) {
    this.userNotifCount++;
    // Extract user info from the new data structure
    let user = 'Inconnu';
    let performedBy = 'Système';

    if (data) {
      // Get the user who performed the action
      if (data.updatedBy) {
        performedBy = `${data.updatedBy.nom} ${data.updatedBy.prenom}`.trim() || data.updatedBy.role || 'Utilisateur';
      } else if (data.deletedBy) {
        performedBy = `${data.deletedBy.nom} ${data.deletedBy.prenom}`.trim() || data.deletedBy.role || 'Utilisateur';
      }

      // Get the affected user info
      if (data.user) {
        user = `${data.user.nom} ${data.user.prenom || ''}`.trim() || data.user.mail || data.user.role || 'Utilisateur';
      }
    }

    // Create a meaningful summary
    let summary = '';
    if (action.includes('Création')) {
      summary = `Nouveau compte: ${user}`;
    } else if (action.includes('Modification')) {
      if (data.changes && Object.keys(data.changes).length > 0) {
        const changedFields = Object.keys(data.changes).join(', ');
        summary = `${user} - Champs modifiés: ${changedFields}`;
      } else {
        summary = `Modifications sur: ${user}`;
      }
    } else if (action.includes('Suppression')) {
      summary = `Compte supprimé: ${user}`;
    } else if (action.includes('Approbation')) {
      summary = `Compte approuvé: ${user}`;
    } else if (action.includes('Rejet')) {
      summary = `Compte rejeté: ${user}${data.reason ? ` - Raison: ${data.reason}` : ''}`;
    }

    this.userNotifDetails.unshift({
      action,
      user: performedBy,
      time: new Date(),
      details: summary
    });

    // Keep only last 10 notifications
    if (this.userNotifDetails.length > 10) {
      this.userNotifDetails = this.userNotifDetails.slice(0, 10);
    }
  }

  resetUserNotif() {
    this.userNotifCount = 0;
    this.notifDropdownOpen = false;
  }

  toggleNotifDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    // Toggle dropdown, and reset notification count when opening
    if (!this.notifDropdownOpen) {
      this.userNotifCount = 0;
    }
    this.notifDropdownOpen = !this.notifDropdownOpen;
  }

  // Close dropdown on outside click
  ngAfterViewInit() {
    document.addEventListener('click', this.handleOutsideClick, true);
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    document.removeEventListener('click', this.handleOutsideClick, true);
  }
  handleOutsideClick = (event: Event) => {
    const notifDropdown = document.querySelector('.notif-dropdown');
    const notifBell = document.querySelector('.notif-bell-btn');
    if (
      this.notifDropdownOpen &&
      notifDropdown &&
      !notifDropdown.contains(event.target as Node) &&
      notifBell &&
      !notifBell.contains(event.target as Node)
    ) {
      this.notifDropdownOpen = false;
    }
  }
  // Optional: close dropdown on outside click
  // Add this to ngOnInit if you want auto-close
  // document.addEventListener('click', () => this.notifDropdownOpen = false);

  isSuperAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'super-admin';
  }

  loadPendingCount(): void {
    this.authService.getPendingUsers().subscribe({
      next: (response) => {
        this.pendingCount = response.count;
      },
      error: (error) => {
        this.logger.error('Failed to load pending count', error);
      }
    });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.authService.logout();
    this.closeMenu();
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  getCurrentUser(): User | null {
    return this.authService.getCurrentUser();
  }


}
