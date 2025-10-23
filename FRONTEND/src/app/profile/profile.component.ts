import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';
import { Observable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { LoggerService } from '../core/services/logger.service';
import { ToastService } from '../shared/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: false,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser$: Observable<User | null>;
  user: User | null = null;
  originalUser: User | null = null; // Store original values for cancel
  isEditing = false;
  isLoading = false;
  private subscription = new Subscription();

  // Password change
  showPasswordChange = false;
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordLoading = false;

  alertMessage: string | null = null;
  alertVariant: 'success' | 'error' | 'warning' | 'info' = 'info';

  constructor(
    public authService: AuthService,
    private router: Router,
    private logger: LoggerService,
    private toastService: ToastService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    // Check if we're in demo mode
    const isDemoMode = this.router.url.includes('/demo/');
    
    // S'abonner aux changements d'utilisateur
    this.subscription.add(
      this.currentUser$.subscribe(user => {
        // In demo mode, always show null user (guest profile)
        if (isDemoMode) {
          this.user = null;
        } else {
          this.user = user;
          // Initialiser les objets imbriqués s'ils n'existent pas
          if (this.user) {
            this.initializeUserDefaults();
          }
        }
      })
    );
  }

  /**
   * Initialiser les valeurs par défaut pour les objets imbriqués
   */
  private initializeUserDefaults(): void {
    if (!this.user) return;

    // Initialiser contact s'il n'existe pas
    if (!this.user.contact) {
      this.user.contact = {};
    }

    // Initialiser preferences s'il n'existe pas
    if (!this.user.preferences) {
      this.user.preferences = {
        theme: 'light',
        language: 'fr',
        notifications: {
          email: true,
          push: false,
          sms: false
        },
        itemsPerPage: 12
      };
    }

    // Initialiser stats s'il n'existe pas
    if (!this.user.stats) {
      this.user.stats = {
        totalLogins: 0,
        studentsCreated: 0,
        studentsModified: 0
      };
    }
  }

  /**
   * Activer le mode édition et initialiser les objets
   */
  enableEdit(): void {
    if (this.user) {
      this.initializeUserDefaults();
      // Store a deep copy of the original user data
      this.originalUser = JSON.parse(JSON.stringify(this.user));
    }
    this.isEditing = true;
  }

  /**
   * Annuler l'édition et restaurer les valeurs originales
   */
  cancelEdit(): void {
    if (this.originalUser) {
      this.user = JSON.parse(JSON.stringify(this.originalUser));
    }
    this.isEditing = false;
    this.toastService.info('Modifications annulées', 'Annulation');
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Sauvegarder les modifications avec validation
   */
  saveProfile(): void {
    if (!this.user) return;

    // Validation basique
    if (!this.user.nom || !this.user.prenom) {
      this.toastService.warning('Veuillez remplir le nom et le prénom', 'Validation');
      return;
    }

    if (!this.user.mail || !this.isValidEmail(this.user.mail)) {
      this.toastService.warning('Veuillez entrer une adresse email valide', 'Validation');
      return;
    }

    this.isLoading = true;
    this.authService.updateProfile(this.user).subscribe({
      next: (response) => {
        this.isEditing = false;
        this.isLoading = false;
        this.originalUser = null; // Clear backup
        this.logger.info('Profil sauvegardé avec succès', response);
        this.toastService.success('Votre profil a été mis à jour avec succès!', 'Succès ✓');
      },
      error: (error) => {
        this.isLoading = false;
        this.logger.error('Erreur lors de la sauvegarde du profil', error);
        const errorMessage = error.error?.message || 'Impossible de mettre à jour le profil';
        this.toastService.error(errorMessage, 'Erreur');
      }
    });
  }

  /**
   * Valider le format email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Obtenir la date maximale pour le sélecteur (aujourd'hui)
   */
  getMaxDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * Déconnexion depuis le profil
   */
  logout(): void {
    this.authService.logout();
  }

  /**
   * Obtenir la date de création formatée
   */
  getCreationDate(): string {
    if (this.user?.createdAt) {
      return new Date(this.user.createdAt).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return 'Date inconnue';
  }

  /**
   * Obtenir la couleur du rôle
   */
  getRoleColor(): string {
    switch (this.user?.role) {
      case 'super-admin': return '#ef4444'; // red
      case 'admin': return '#8b5cf6'; // violet
      case 'teacher': return '#10b981'; // emerald
      case 'student': return '#3b82f6'; // blue
      default: return '#6b7280'; // gray for user/moderator
    }
  }

  /**
   * Obtenir l'icône du rôle
   */
  getRoleIcon(): string {
    switch (this.user?.role) {
      case 'super-admin': return '👑';
      case 'admin': return '👑';
      case 'teacher': return '👨‍🏫';
      case 'student': return '🎓';
      case 'moderator': return '🛡️';
      default: return '👤';
    }
  }

  /**
   * Obtenir le libellé du rôle
   */
  getRoleLabel(role?: string): string {
    switch (role) {
      case 'super-admin': return 'Super Admin';
      case 'admin': return 'Administrateur';
      case 'teacher': return 'Enseignant';
      case 'student': return 'Étudiant';
      case 'moderator': return 'Modérateur';
      default: return 'Utilisateur';
    }
  }

  /**
   * Obtenir le libellé du genre
   */
  getGenreLabel(genre?: string): string {
    switch (genre) {
      case 'M': return 'Masculin';
      case 'F': return 'Féminin';
      case 'Autre': return 'Autre';
      default: return 'Non spécifié';
    }
  }

  /**
   * Obtenir le libellé du thème
   */
  getThemeLabel(theme?: string): string {
    switch (theme) {
      case 'light': return '☀️ Clair';
      case 'dark': return '🌙 Sombre';
      case 'auto': return '🔄 Automatique';
      default: return '☀️ Clair';
    }
  }

  /**
   * Obtenir le libellé de la langue
   */
  getLanguageLabel(language?: string): string {
    switch (language) {
      case 'fr': return '🇫🇷 Français';
      case 'en': return '🇬🇧 English';
      case 'ar': return '🇲🇦 العربية';
      default: return '🇫🇷 Français';
    }
  }

  /**
   * Toggle password change form
   */
  togglePasswordChange(): void {
    this.showPasswordChange = !this.showPasswordChange;
    if (!this.showPasswordChange) {
      // Reset form
      this.currentPassword = '';
      this.newPassword = '';
      this.confirmPassword = '';
    }
  }

  /**
   * Show password form and scroll to security section
   */
  openPasswordChange(): void {
    this.showPasswordChange = true;
    setTimeout(() => {
      const el = document.getElementById('security-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }

  /**
   * Change password
   */
  changePassword(): void {
    // Validation
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.toastService.warning('Veuillez remplir tous les champs', 'Validation');
      return;
    }

    if (this.newPassword.length < 6) {
      this.toastService.warning('Le nouveau mot de passe doit contenir au moins 6 caractères', 'Validation');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.toastService.warning('Les mots de passe ne correspondent pas', 'Validation');
      return;
    }

    this.passwordLoading = true;
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (response) => {
        this.passwordLoading = false;
        this.toastService.success(response.message, 'Succès ✓');
        this.togglePasswordChange(); // Close and reset form
      },
      error: (error) => {
        this.passwordLoading = false;
        this.logger.error('Erreur lors du changement de mot de passe', error);
        const errorMessage = error.error?.message || 'Impossible de modifier le mot de passe';
        this.toastService.error(errorMessage, 'Erreur');
      }
    });
  }
}
