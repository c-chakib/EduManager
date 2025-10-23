import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-user-management',
  standalone: false,
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
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

  constructor(
    private authService: AuthService,
    private logger: LoggerService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
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
