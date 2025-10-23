import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-admin-approvals',
  standalone: false,
  templateUrl: './admin-approvals.component.html',
  styleUrls: ['./admin-approvals.component.css']
})
export class AdminApprovalsComponent implements OnInit {
  pendingUsers: User[] = [];
  loading = false;

  constructor(
    private authService: AuthService,
    private logger: LoggerService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadPendingUsers();
  }

  loadPendingUsers(): void {
    this.loading = true;
    this.authService.getPendingUsers().subscribe({
      next: (response) => {
        this.pendingUsers = response.data;
        this.loading = false;
        this.logger.info('Loaded pending users', { count: response.count });
      },
      error: (error) => {
        this.loading = false;
        this.logger.error('Failed to load pending users', error);
        this.toastService.error('Erreur lors du chargement des demandes en attente');
      }
    });
  }

  approveUser(user: User): void {
    if (!user._id) return;
    
    this.authService.approveUser(user._id).subscribe({
      next: (response) => {
        this.toastService.success(response.message, 'Approuvé ✓');
        this.loadPendingUsers(); // Reload list
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
    if (reason === null) return; // User cancelled

    this.authService.rejectUser(user._id, reason || 'Non spécifié').subscribe({
      next: (response) => {
        this.toastService.success(response.message, 'Rejeté');
        this.loadPendingUsers(); // Reload list
      },
      error: (error) => {
        this.logger.error('Failed to reject user', error);
        this.toastService.error('Erreur lors du refus');
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
}
