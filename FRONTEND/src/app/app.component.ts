import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'etudiants';

  constructor(
    private authService: AuthService,
    private googleAuthService: GoogleAuthService
  ) {}

  ngOnInit(): void {
    // Initialize Google Sign-In
    if (environment.google?.clientId) {
      this.googleAuthService.initializeGoogleSignIn(environment.google.clientId);
    }

    // Auto-refresh user data on app load if authenticated
    if (this.authService.isAuthenticated()) {
      this.authService.refreshCurrentUser().subscribe({
        error: (err) => {
          // If refresh fails (e.g., token expired), logout
          console.error('Failed to refresh user, logging out', err);
          this.authService.logout();
        }
      });
    }
  }
}
