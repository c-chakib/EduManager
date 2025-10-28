import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../shared/services/toast.service';
import { GoogleAuthService } from '../../services/google-auth.service';
import { environment } from '../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error = '';
  info = '';
  returnUrl = '';
  isGoogleInitialized = false;
  private googleLoginInProgress = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private googleAuthService: GoogleAuthService,
    private logger: LoggerService,
    private toastService: ToastService
  ) {
    this.loginForm = this.fb.group({
      mail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

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
      if (this.googleLoginInProgress) {
        // Prevent duplicate toast if Google login just happened
        this.googleLoginInProgress = false;
        return;
      }
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

  onGoogleFallbackLogin(): void {
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
            this.googleLoginInProgress = true;
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
                  this.error = error.error?.message || 'Accès Google refusé.';
                  this.toastService.warning(this.error, 'Compte non actif', 5000);
                } else {
                  this.error = error.error?.message || 'Erreur Google.';
                  this.toastService.error(this.error, 'Erreur Google');
                }
              }
            );
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
