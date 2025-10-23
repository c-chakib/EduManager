import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'etudiants';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
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
