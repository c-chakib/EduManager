import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/user.model';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../shared/services/toast.service';
import { GoogleAuthService, GoogleUser } from '../../services/google-auth.service';
import { environment } from '../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  get mail() {
    return this.loginForm.get('mail');
  }

  get password() {
    return this.loginForm.get('password');
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = '';
      const credentials = {
        mail: this.loginForm.value.mail,
        password: this.loginForm.value.password
      };
      this.authService.login(credentials).subscribe(
        () => {
          this.toastService.success('Connexion réussie !', 'Bienvenue', 3000);
          const returnUrl = this.returnUrl || '/dashboard';
          this.router.navigate([returnUrl]);
        },
        (error) => {
          this.logger.error('Erreur de connexion', error);
          this.loading = false;
          if (error.status === 404) {
            this.error = 'Aucun compte trouvé. Veuillez vous inscrire d\'abord.';
            this.toastService.error(this.error, 'Compte non trouvé');
          } else if (error.status === 403) {
            this.error = error.error?.message || 'Accès refusé.';
            this.toastService.warning(this.error, 'Compte non actif', 5000);
          } else {
            this.error = error.error?.message || 'Erreur lors de la connexion.';
            this.toastService.error(this.error, 'Erreur');
          }
        }
      );
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }
  private destroy$ = new Subject<void>();
  
  loginForm: FormGroup;
  loading = false;
  error = '';
  info = '';
  returnUrl = '';
  isGoogleInitialized = false;
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private googleAuthService: GoogleAuthService,
    private logger: LoggerService,
    private toastService: ToastService
  ) {
    // Initialize the login form
    this.loginForm = this.fb.group({
      mail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // ...existing code...
    // ...existing code...

  ngOnInit(): void {
    // Render Google Sign-In button
    const clientId = environment.google?.clientId;
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id && clientId) {
      google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        prompt: 'select_account',
        callback: (response: any) => {
          // Use the credential directly from the response
          const idToken = response.credential;
          if (idToken) {
            this.googleAuthService.handleCredentialResponse(response);
            this.authService.googleSignIn(idToken).subscribe(
              (result) => {
                this.logger.info('Google login successful', { user: result.user?.mail });
                this.toastService.success(
                  `Bienvenue ${result.user?.nom || result.user?.prenom || ''} !`,
                  'Connexion Google réussie',
                  3000
                );
                const returnUrl = this.returnUrl || '/dashboard';
                this.router.navigate([returnUrl]);
              },
              (error) => {
                this.logger.error('Google login failed', error);
                this.loading = false;
                if (error.status === 404) {
                  this.error = 'Aucun compte Google trouvé. Veuillez vous inscrire d\'abord.';
                  this.toastService.error(this.error, 'Compte non trouvé');
                } else if (error.status === 403) {
                  this.error = error.error?.message || 'Accès refusé.';
                  this.toastService.warning(this.error, 'Compte non actif', 5000);
                } else {
                  this.error = error.error?.message || 'Erreur lors de la connexion Google.';
                  this.toastService.error(this.error, 'Erreur Google');
                }
              }
            );
          } else {
            this.error = 'Token Google manquant.';
            this.toastService.error(this.error, 'Erreur Google');
          }
        }
      });
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { theme: 'outline', size: 'large', width: 320 }
      );
      this.isGoogleInitialized = true;
    } else {
      this.isGoogleInitialized = false;
    }
  }
}
