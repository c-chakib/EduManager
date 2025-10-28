import { Component, ViewEncapsulation, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LoggerService } from '../../core/services/logger.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  encapsulation: ViewEncapsulation.Emulated
})
export class NavbarComponent implements OnInit, OnDestroy {
  // Menu states
  isMenuOpen = false;
  userDropdownOpen = false;
  notifDropdownOpen = false;

  // Authentication
  isAuthenticated$: Observable<boolean>;
  currentUser$: Observable<User | null>;

  // Notifications
  pendingCount = 0;
  userNotifCount = 0;
  userNotifDetails: Array<{
    action: string;
    user: string;
    time: Date;
    details: any;
  }> = [];

  private subscription = new Subscription();

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
    // Subscribe to authentication changes
    this.subscription.add(
      this.isAuthenticated$.subscribe(isAuth => {
        this.logger.debug('🔐 Authentication state:', isAuth);
        if (isAuth && this.isSuperAdmin()) {
          this.loadPendingCount();
        }
      })
    );

    // Listen for pending users changes
    this.subscription.add(
      this.authService.pendingUsersChanged$.subscribe(() => {
        if (this.isSuperAdmin()) {
          this.loadPendingCount();
        }
      })
    );

    // Listen for user management events (super-admin only)
    if (this.isSuperAdmin()) {
      this.setupSocketListeners();
    }

    // Close menu on navigation
    this.subscription.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.closeAllDropdowns();
        })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Close dropdowns when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    // Close user dropdown if clicking outside
    if (this.userDropdownOpen) {
      const dropdownTrigger = document.querySelector('.user-dropdown-trigger');
      const dropdownMenu = document.querySelector('.user-dropdown-menu');
      
      if (dropdownTrigger && dropdownMenu) {
        if (!dropdownTrigger.contains(target) && !dropdownMenu.contains(target)) {
          this.userDropdownOpen = false;
        }
      }
    }

    // Close notification dropdown if clicking outside
    if (this.notifDropdownOpen) {
      const notifBell = document.querySelector('.notif-bell-btn');
      const notifDropdown = document.querySelector('.notif-dropdown');
      
      if (notifBell && notifDropdown) {
        if (!notifBell.contains(target) && !notifDropdown.contains(target)) {
          this.notifDropdownOpen = false;
        }
      }
    }
  }

  /**
   * Close menu on escape key
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeAllDropdowns();
  }

  /**
   * Toggle user dropdown
   */
  toggleUserDropdown(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.userDropdownOpen = !this.userDropdownOpen;
    // Close notification dropdown if open
    if (this.userDropdownOpen) {
      this.notifDropdownOpen = false;
    }
  }

  /**
   * Toggle notification dropdown
   */
  toggleNotifDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    // Reset notification count when opening
    if (!this.notifDropdownOpen) {
      this.userNotifCount = 0;
    }
    
    this.notifDropdownOpen = !this.notifDropdownOpen;
    
    // Close user dropdown if open
    if (this.notifDropdownOpen) {
      this.userDropdownOpen = false;
    }
  }

  /**
   * Toggle mobile menu
   */
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    // Close dropdowns when opening mobile menu
    if (this.isMenuOpen) {
      this.userDropdownOpen = false;
      this.notifDropdownOpen = false;
    }
    // Prevent body scroll when menu is open
    document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
  }

  /**
   * Close mobile menu
   */
  closeMenu(): void {
    this.isMenuOpen = false;
    document.body.style.overflow = '';
  }

  /**
   * Close all dropdowns
   */
  closeAllDropdowns(): void {
    this.isMenuOpen = false;
    this.userDropdownOpen = false;
    this.notifDropdownOpen = false;
    document.body.style.overflow = '';
  }

  /**
   * Navigate to profile
   */
  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.closeAllDropdowns();
  }

  /**
   * Logout user
   */
  logout(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.onLogout(user);
    }
    this.authService.logout();
    this.closeAllDropdowns();
  }

  /**
   * Check if route is active
   */
  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  /**
   * Check if user is super admin
   */
  isSuperAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'super-admin';
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  /**
   * Load pending users count
   */
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

  /**
   * Setup socket listeners for user management events
   */
  private setupSocketListeners(): void {
    this.subscription.add(
      this.socketService.onUserCreated().subscribe((data: any) => 
        this.addUserNotif('Création utilisateur', data)
      )
    );

    this.subscription.add(
      this.socketService.onUserUpdated().subscribe((data: any) => 
        this.addUserNotif('Modification utilisateur', data)
      )
    );

    this.subscription.add(
      this.socketService.onUserDeleted().subscribe((data: any) => 
        this.addUserNotif('Suppression utilisateur', data)
      )
    );

    this.subscription.add(
      this.socketService.onUserApproved().subscribe((data: any) => 
        this.addUserNotif('Approbation utilisateur', data)
      )
    );

    this.subscription.add(
      this.socketService.onUserRejected().subscribe((data: any) => 
        this.addUserNotif('Rejet utilisateur', data)
      )
    );
  }

  /**
   * Add user notification
   */
  addUserNotif(action: string, data: any): void {
    this.userNotifCount++;

    let user = 'Inconnu';
    let performedBy = 'Système';

    if (data) {
      // Get the user who performed the action
      if (data.updatedBy) {
        performedBy = `${data.updatedBy.nom || ''} ${data.updatedBy.prenom || ''}`.trim() 
          || data.updatedBy.role 
          || 'Utilisateur';
      } else if (data.deletedBy) {
        performedBy = `${data.deletedBy.nom || ''} ${data.deletedBy.prenom || ''}`.trim() 
          || data.deletedBy.role 
          || 'Utilisateur';
      }

      // Get the affected user info
      if (data.user) {
        user = `${data.user.nom || ''} ${data.user.prenom || ''}`.trim() 
          || data.user.mail 
          || data.user.role 
          || 'Utilisateur';
      }
    }

    // Create a meaningful summary
    let summary = this.createNotificationSummary(action, user, data);

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

  /**
   * Create notification summary based on action type
   */
  private createNotificationSummary(action: string, user: string, data: any): string {
    if (action.includes('Création')) {
      return `Nouveau compte: ${user}`;
    } else if (action.includes('Modification')) {
      if (data.changes && Object.keys(data.changes).length > 0) {
        const changedFields = Object.keys(data.changes).join(', ');
        return `${user} - Champs modifiés: ${changedFields}`;
      }
      return `Modifications sur: ${user}`;
    } else if (action.includes('Suppression')) {
      return `Compte supprimé: ${user}`;
    } else if (action.includes('Approbation')) {
      return `Compte approuvé: ${user}`;
    } else if (action.includes('Rejet')) {
      const reason = data.reason ? ` - Raison: ${data.reason}` : '';
      return `Compte rejeté: ${user}${reason}`;
    }
    return `Action: ${action} - ${user}`;
  }

  /**
   * Reset user notifications
   */
  resetUserNotif(): void {
    this.userNotifCount = 0;
    this.notifDropdownOpen = false;
  }

  /**
   * Emit notification for profile view
   */
  onProfileView(user: User): void {
    this.addUserNotif('Consultation profil', { user });
  }

  /**
   * Emit notification for logout
   */
  onLogout(user: User): void {
    this.addUserNotif('Déconnexion', { user });
  }
}