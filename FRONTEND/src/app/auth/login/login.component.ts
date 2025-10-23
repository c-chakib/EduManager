import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/user.model';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private destroy$ = new Subject<void>();
  
  loginForm: FormGroup;
  loading = false;
  error = '';
  info = '';
  returnUrl = '';
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private logger: LoggerService,
    private toastService: ToastService
  ) {
    this.loginForm = this.fb.group({
      mail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    // Récupérer l'URL de retour
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Afficher les messages d'erreur si présents
    const error = this.route.snapshot.queryParams['error'];
    const pending = this.route.snapshot.queryParams['pending'];
    
    if (pending === 'true') {
      this.info = 'Votre compte est en attente d\'approbation. Vous pourrez vous connecter une fois votre compte approuvé par l\'administrateur.';
      // Nettoyer les paramètres d'URL
      setTimeout(() => {
        this.router.navigate(['/auth/login'], { replaceUrl: true });
      }, 100);
    } else if (error === 'session_expired') {
      this.error = 'Votre session a expiré. Veuillez vous reconnecter.';
      // Nettoyer les paramètres d'URL après affichage
      setTimeout(() => {
        this.router.navigate(['/auth/login'], { replaceUrl: true });
      }, 100);
    } else if (error === 'insufficient_role') {
      this.error = 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.loading) {
      this.loading = true;
      this.error = '';
      
      const credentials: LoginRequest = this.loginForm.value;
      
      this.authService.login(credentials)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.logger.info('Login successful', { user: response.user.mail });
            this.toastService.success(
              `Bienvenue ${response.user.nom || ''} !`,
              'Connexion réussie',
              3000
            );
            // Le service AuthService gère déjà la redirection
            this.loading = false;
          },
          error: (error) => {
            this.logger.error('Login failed', error);
            this.loading = false;
            
            if (error.status === 404) {
              this.error = 'Aucun utilisateur trouvé avec cette adresse email.';
              this.toastService.error(this.error, 'Erreur de connexion');
            } else if (error.status === 401) {
              this.error = 'Mot de passe incorrect.';
              this.toastService.error(this.error, 'Erreur de connexion');
            } else if (error.status === 403) {
              // Account status issues (pending, rejected, suspended)
              this.error = error.error?.message || 'Accès refusé.';
              this.toastService.warning(this.error, 'Compte non actif', 5000);
            } else if (error.status === 0) {
              this.error = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
              this.toastService.error(this.error, 'Erreur réseau');
            } else {
              this.error = error.error?.message || 'Une erreur est survenue lors de la connexion.';
              this.toastService.error(this.error, 'Erreur de connexion');
            }
          }
        });
    } else {
      // Marquer tous les champs comme touched pour afficher les erreurs
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  // Getters pour l'accès facile aux contrôles du formulaire
  get mail() { return this.loginForm.get('mail'); }
  get password() { return this.loginForm.get('password'); }
}
