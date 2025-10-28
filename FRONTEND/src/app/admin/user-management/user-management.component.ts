import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../shared/services/toast.service';
import { SocketService } from '../../services/socket.service';
import { RecentActivityService } from '../../services/recent-activity.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-management',
  standalone: false,
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  pendingUsers: User[] = [];
  loading = false;
  
  // Filters
  searchTerm = '';
  filterStatus: string = 'all';
  filterRole: string = 'all';
  
  // Edit modal
  showEditModal = false;
  editingUser: User | null = null;
  
  // Delete confirmation
  showDeleteConfirm = false;
  userToDelete: User | null = null;

  // Notifications
  notifications: any[] = [];
  showNotifications = false;
  private subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private logger: LoggerService,
    private toastService: ToastService,
    private socketService: SocketService,
    private recentActivityService: RecentActivityService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private setupSocketListeners(): void {
    console.log('[UserManagement] Setting up socket listeners');

    // Listen for user management events
    this.subscription.add(
      this.socketService.onUserCreated().subscribe((data: any) => {
        console.log('[UserManagement] Received userCreated event:', data);
        this.addNotification('Création utilisateur', data);
        this.loadUsers(); // Refresh the list
      })
    );

    this.subscription.add(
      this.socketService.onUserUpdated().subscribe((data: any) => {
        console.log('[UserManagement] Received userUpdated event:', data);
        this.addNotification('Modification utilisateur', data);
        this.loadUsers(); // Refresh the list
      })
    );

    this.subscription.add(
      this.socketService.onUserDeleted().subscribe((data: any) => {
        console.log('[UserManagement] Received userDeleted event:', data);
        this.addNotification('Suppression utilisateur', data);
        this.loadUsers(); // Refresh the list
      })
    );

    this.subscription.add(
      this.socketService.onUserApproved().subscribe((data: any) => {
        console.log('[UserManagement] Received userApproved event:', data);
        this.addNotification('Approbation utilisateur', data);
        this.loadUsers(); // Refresh the list
      })
    );

    this.subscription.add(
      this.socketService.onUserRejected().subscribe((data: any) => {
        console.log('[UserManagement] Received userRejected event:', data);
        this.addNotification('Rejet utilisateur', data);
        this.loadUsers(); // Refresh the list
      })
    );

    this.subscription.add(
      this.socketService.onUserSuspended().subscribe((data: any) => {
        console.log('[UserManagement] Received userSuspended event:', data);
        this.addNotification('Suspension utilisateur', data);
        this.loadUsers(); // Refresh the list
      })
    );

    this.subscription.add(
      this.socketService.onUserReactivated().subscribe((data: any) => {
        console.log('[UserManagement] Received userReactivated event:', data);
        this.addNotification('Réactivation utilisateur', data);
        this.loadUsers(); // Refresh the list
      })
    );

    // Listen for student management events
    this.subscription.add(
      this.socketService.onStudentUpdated().subscribe((data: any) => {
        console.log('[UserManagement] Received studentUpdated event:', data);
        this.addNotification('Modification étudiant', data);
        // Optionally refresh students list here
      })
    );
    this.subscription.add(
      this.socketService.onStudentDeleted().subscribe((data: any) => {
        console.log('[UserManagement] Received studentDeleted event:', data);
        this.addNotification('Suppression étudiant', data);
        // Optionally refresh students list here
      })
    );
  }

  private addNotification(action: string, data: any): void {
    // Extract user info from the data structure
    let user = 'Inconnu';
    let performedBy = 'Système';
    let summary = '';

    if (data) {
      // For student events
      if (action.includes('étudiant')) {
        // Try to extract student name or id
        if (data.nom || data.prenom) {
          user = `${data.nom || ''} ${data.prenom || ''}`.trim();
        } else if (data.student && (data.student.nom || data.student.prenom)) {
          user = `${data.student.nom || ''} ${data.student.prenom || ''}`.trim();
        } else if (data.student && data.student.id) {
          user = `ID: ${data.student.id}`;
        } else if (data.id) {
          user = `ID: ${data.id}`;
        }
        // Try to extract who performed the action
        if (data.updatedBy && (data.updatedBy.nom || data.updatedBy.prenom)) {
          performedBy = `${data.updatedBy.nom || ''} ${data.updatedBy.prenom || ''}`.trim();
        } else if (data.deletedBy && (data.deletedBy.nom || data.deletedBy.prenom)) {
          performedBy = `${data.deletedBy.nom || ''} ${data.deletedBy.prenom || ''}`.trim();
        } else if (data.createdBy && (data.createdBy.nom || data.createdBy.prenom)) {
          performedBy = `${data.createdBy.nom || ''} ${data.createdBy.prenom || ''}`.trim();
        } else {
          performedBy = 'Utilisateur';
        }
        // Details for modification
        if (action.includes('Modification')) {
          if (data.changes && Object.keys(data.changes).length > 0) {
            const changedFields = Object.keys(data.changes).join(', ');
            summary = `${user} - Champs modifiés: ${changedFields}`;
          } else {
            summary = `Modifications sur: ${user}`;
          }
        } else if (action.includes('Suppression')) {
          summary = `Étudiant supprimé: ${user}`;
        }
      } else {
        // For user events (existing logic)
        if (data.updatedBy) {
          performedBy = `${data.updatedBy.nom || ''} ${data.updatedBy.prenom || ''}`.trim() || data.updatedBy.role || 'Utilisateur';
        } else if (data.deletedBy) {
          performedBy = `${data.deletedBy.nom || ''} ${data.deletedBy.prenom || ''}`.trim() || data.deletedBy.role || 'Utilisateur';
        } else if (data.approvedBy) {
          performedBy = `${data.approvedBy.nom || ''} ${data.approvedBy.prenom || ''}`.trim() || data.approvedBy.role || 'Utilisateur';
        } else if (data.rejectedBy) {
          performedBy = `${data.rejectedBy.nom || ''} ${data.rejectedBy.prenom || ''}`.trim() || data.rejectedBy.role || 'Utilisateur';
        }
        if (data.user) {
          user = `${data.user.nom || ''} ${data.user.prenom || ''}`.trim() || data.user.mail || data.user.role || 'Utilisateur';
        }
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
        } else if (action.includes('Suspension')) {
          summary = `Compte suspendu: ${user}${data.reason ? ` - Raison: ${data.reason}` : ''}`;
        } else if (action.includes('Réactivation')) {
          summary = `Compte réactivé: ${user}`;
        }
      }
    }

    const notification = {
      id: Date.now(),
      action,
      user: performedBy,
      time: new Date(),
      details: summary,
      read: false
    };

    this.notifications.unshift(notification);

    // Keep only last 10 notifications
    if (this.notifications.length > 10) {
      this.notifications = this.notifications.slice(0, 10);
    }

    // Log to Recent Activity Service
    const activityType = action.includes('Création') ? 'user_created' :
                        action.includes('Modification') ? 'user_updated' :
                        action.includes('Suppression') ? 'user_deleted' :
                        'user_status_changed';

    this.recentActivityService.addActivity({
  type: activityType,
  action: action,
  details: summary,
  userId: data.user?.id || '',
  userName: user,
  performedBy: performedBy, // always nom/prenom or role
  performedByName: performedBy
    });

    // Auto-show notifications for 5 seconds
    this.showNotifications = true;
    setTimeout(() => {
      this.showNotifications = false;
    }, 5000);
  }

  markNotificationAsRead(notificationId: number): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  clearNotifications(): void {
    this.notifications = [];
    this.showNotifications = false;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  get unreadNotificationsCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  loadUsers(): void {
    this.loading = true;
    const filters: any = {};
    
    if (this.filterStatus !== 'all') {
      filters.status = this.filterStatus;
    }
    if (this.filterRole !== 'all') {
      filters.role = this.filterRole;
    }
    if (this.searchTerm.trim()) {
      filters.search = this.searchTerm.trim();
    }

    this.authService.getAllUsersManagement(filters).subscribe({
      next: (response) => {
        this.users = response.data;
        this.filteredUsers = response.data;
        this.pendingUsers = this.users.filter(u => u.accountStatus === 'pending');
        this.loading = false;
        this.logger.info('Loaded users', { count: response.count });
      },
      error: (error) => {
        this.loading = false;
        this.logger.error('Failed to load users', error);
        this.toastService.error('Erreur lors du chargement des utilisateurs');
      }
    });
  }

  onFilterChange(): void {
    this.loadUsers();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.filterStatus = 'all';
    this.filterRole = 'all';
    this.onFilterChange();
  }

  getRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'super-admin': return 'badge-super-admin';
      case 'admin': return 'badge-admin';
      case 'teacher': return 'badge-teacher';
      case 'student': return 'badge-student';
      default: return 'badge-user';
    }
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'approved': return 'badge-approved';
      case 'pending': return 'badge-pending';
      case 'rejected': return 'badge-rejected';
      case 'suspended': return 'badge-suspended';
      default: return 'badge-suspended';
    }
  }

  getRoleLabel(role?: string): string {
    switch (role) {
      case 'super-admin': return '👑 Super Admin';
      case 'admin': return '🛡️ Admin';
      case 'teacher': return '👨‍🏫 Enseignant';
      case 'student': return '🎓 Étudiant';
      default: return '👤 Utilisateur';
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'approved': return '✓ Approuvé';
      case 'pending': return '⏳ En attente';
      case 'rejected': return '✗ Rejeté';
      case 'suspended': return '🚫 Suspendu';
      default: return status || 'Inconnu';
    }
  }

  openEditModal(user: User): void {
    this.editingUser = JSON.parse(JSON.stringify(user)); // Deep copy
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUser = null;
  }

  saveUser(): void {
    if (!this.editingUser?._id) return;

    this.authService.updateUserById(this.editingUser._id, this.editingUser).subscribe({
      next: (response) => {
        this.toastService.success(response.message, 'Succès ✓');
        this.closeEditModal();
        this.loadUsers();
      },
      error: (error) => {
        this.logger.error('Failed to update user', error);
        this.toastService.error(error.error?.message || 'Erreur lors de la mise à jour');
      }
    });
  }

  approveUser(user: User): void {
    if (!user._id) return;
    
    this.authService.approveUser(user._id).subscribe({
      next: (response) => {
        this.toastService.success(response.message, 'Approuvé ✓');
        this.loadUsers();
      },
      error: (error) => {
        this.logger.error('Failed to approve user', error);
        this.toastService.error('Erreur lors de l\'approbation');
      }
    });
  }

  rejectUser(user: User): void {
    if (!user._id) return;

    const reason = prompt('Raison du refus (optionnel):');
    if (reason === null) return;

    this.authService.rejectUser(user._id, reason || 'Non spécifié').subscribe({
      next: (response) => {
        this.toastService.success(response.message, 'Rejeté');
        this.loadUsers();
      },
      error: (error) => {
        this.logger.error('Failed to reject user', error);
        this.toastService.error('Erreur lors du refus');
      }
    });
  }

  openDeleteConfirm(user: User): void {
    this.userToDelete = user;
    this.showDeleteConfirm = true;
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.userToDelete = null;
  }

  confirmDelete(): void {
    if (!this.userToDelete?._id) return;

    this.authService.deleteUserById(this.userToDelete._id).subscribe({
      next: (response) => {
        this.toastService.success(response.message, 'Supprimé');
        this.closeDeleteConfirm();
        this.loadUsers();
      },
      error: (error) => {
        this.logger.error('Failed to delete user', error);
        this.toastService.error(error.error?.message || 'Erreur lors de la suppression');
      }
    });
  }

  getCreationDate(date: Date | string | undefined): string {
    if (!date) return 'Date inconnue';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  suspend(user: User): void {
    if (!user._id) return;
    const reason = prompt('Raison de la suspension (optionnel):');
    this.authService.suspendUser(user._id, reason || 'Non spécifié').subscribe({
      next: (response) => {
        this.toastService.success(response.message || 'Utilisateur suspendu');
        this.loadUsers();
      },
      error: (error) => {
        this.logger.error('Failed to suspend user', error);
        this.toastService.error(error.error?.message || 'Erreur lors de la suspension');
      }
    });
  }

  reactivate(user: User): void {
    if (!user._id) return;
    this.authService.reactivateUser(user._id).subscribe({
      next: (response) => {
        this.toastService.success(response.message || 'Utilisateur réactivé');
        this.loadUsers();
      },
      error: (error) => {
        this.logger.error('Failed to reactivate user', error);
        this.toastService.error(error.error?.message || 'Erreur lors de la réactivation');
      }
    });
  }
}
