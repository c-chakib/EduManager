import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/user.model';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  private destroy$ = new Subject<void>();
  
  registerForm: FormGroup;
  loading = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private logger: LoggerService,
    private toastService: ToastService
  ) {
    this.registerForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      mail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['user', [Validators.required]],
      adminCode: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Validator personnalisé pour vérifier que les mots de passe correspondent
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword && confirmPassword.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.loading) {
      this.loading = true;
      this.error = '';
      this.success = '';
      
      const { confirmPassword, ...userData } = this.registerForm.value;
      const registerData: RegisterRequest = userData;
      
      this.authService.register(registerData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.logger.info('Registration successful', { user: response.user.mail });
            this.loading = false;
            
            // Check if account requires approval
            if ((response as any).requiresApproval) {
              const isAdmin = registerData.role === 'admin';
              this.success = isAdmin 
                ? 'Votre demande d\'administrateur a été enregistrée et est en attente d\'approbation.'
                : 'Votre compte a été créé avec succès et est en attente d\'approbation.';
              this.toastService.success(
                isAdmin
                  ? 'Votre demande d\'administrateur sera examinée par le super-administrateur. Vous recevrez une notification une fois votre compte approuvé.'
                  : 'Votre compte sera activé par l\'administrateur sous peu. Vous recevrez une notification une fois approuvé.',
                'Compte en attente',
                5000
              );
              // Redirect to login page with pending flag after 3 seconds
              setTimeout(() => {
                this.router.navigate(['/auth/login'], { queryParams: { pending: 'true' } });
              }, 3000);
            } else {
              this.success = 'Inscription réussie ! Redirection en cours...';
              this.toastService.success(
                'Votre compte a été créé avec succès!',
                'Inscription réussie',
                3000
              );
              // AuthService already handles auto-login and redirection
            }
          },
          error: (error) => {
            this.logger.error('Registration failed', error);
            this.loading = false;
            
            if (error.status === 400) {
              this.error = 'Données invalides. Vérifiez vos informations.';
              this.toastService.error(this.error, 'Erreur d\'inscription');
            } else if (error.status === 409) {
              this.error = 'Cette adresse email est déjà utilisée.';
              this.toastService.error(this.error, 'Erreur d\'inscription');
            } else if (error.status === 0) {
              this.error = 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
              this.toastService.error(this.error, 'Erreur réseau');
            } else {
              this.error = error.error?.message || 'Une erreur est survenue lors de l\'inscription.';
              this.toastService.error(this.error, 'Erreur d\'inscription');
            }
          }
        });
    } else {
      // Marquer tous les champs comme touched pour afficher les erreurs
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  // Getters pour l'accès facile aux contrôles du formulaire
  get nom() { return this.registerForm.get('nom'); }
  get prenom() { return this.registerForm.get('prenom'); }
  get mail() { return this.registerForm.get('mail'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  get role() { return this.registerForm.get('role'); }
  get adminCode() { return this.registerForm.get('adminCode'); }
  
  get isAdminSelected(): boolean {
    return this.role?.value === 'admin';
  }
}
