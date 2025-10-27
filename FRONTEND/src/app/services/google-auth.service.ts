import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoggerService } from '../core/services/logger.service';

declare var google: any;

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  verified_email: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private readonly API_URL = `${environment.apiUrl}${environment.apiEndpoints.users}`;
  private googleAuth: any;
  private isInitialized = false;

  private googleUserSubject = new BehaviorSubject<GoogleUser | null>(null);
  public googleUser$ = this.googleUserSubject.asObservable();
  private currentCredential: string | null = null;

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  /**
   * Initialize Google Sign-In
   */
  initializeGoogleSignIn(clientId: string): void {
    if (this.isInitialized) {
      this.logger.warn('Google Sign-In already initialized');
      return;
    }

    try {
      // Load Google Identity Services
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          this.handleCredentialResponse(response);
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      this.isInitialized = true;
      this.logger.info('Google Sign-In initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Google Sign-In:', error);
    }
  }

  /**
   * Render Google Sign-In button
   */
  renderButton(elementId: string, options: any = {}): void {
    if (!this.isInitialized) {
      this.logger.error('Google Sign-In not initialized. Call initializeGoogleSignIn() first.');
      return;
    }

    const defaultOptions = {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: '100%'
    };

    google.accounts.id.renderButton(
      document.getElementById(elementId),
      { ...defaultOptions, ...options }
    );
  }

  /**
   * Handle the credential response from Google
   */
  private handleCredentialResponse(response: any): void {
    try {
      // Store the credential (ID token)
      this.currentCredential = response.credential;

      // Decode the JWT token to get user info
      const payload = this.decodeJwtResponse(response.credential);
      const googleUser: GoogleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
        verified_email: payload.email_verified
      };

      this.googleUserSubject.next(googleUser);
      this.logger.info('Google user authenticated:', googleUser.email);
    } catch (error) {
      this.logger.error('Failed to handle Google credential response:', error);
    }
  }

  /**
   * Decode JWT token
   */
  private decodeJwtResponse(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }

  /**
   * Sign in with Google (server-side)
   */
  signInWithGoogle(idToken: string): Observable<any> {
    return this.http.post(`${this.API_URL}/google-signin`, { idToken });
  }

  /**
   * Sign up with Google (server-side)
   */
  signUpWithGoogle(idToken: string): Observable<any> {
    return this.http.post(`${this.API_URL}/google-signup`, { idToken });
  }

  /**
   * Sign out from Google
   */
  signOut(): void {
    if (this.isInitialized) {
      google.accounts.id.disableAutoSelect();
      this.googleUserSubject.next(null);
      this.logger.info('Google user signed out');
    }
  }

  /**
   * Get current Google user
   */
  getCurrentGoogleUser(): GoogleUser | null {
    return this.googleUserSubject.value;
  }

  /**
   * Get current credential (ID token)
   */
  getCurrentCredential(): string | null {
    return this.currentCredential;
  }
}
