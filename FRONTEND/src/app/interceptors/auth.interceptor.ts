import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { LoggerService } from '../core/services/logger.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router,
    private logger: LoggerService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtenir le token
    const token = this.authService.getToken();
    
    // Identifier les requêtes d'authentification et publiques
    const isAuthRequest = request.url.includes('/users/login') || request.url.includes('/users/register');
    const isDemoRequest = request.url.includes('isDemo=true'); // Demo mode requests don't need auth
    const isApiRequest = request.url.startsWith(environment.apiUrl);
    
    
    // Ajouter le token uniquement aux requêtes API qui en ont besoin (skip auth and demo requests)
    if (token && !isAuthRequest && !isDemoRequest && isApiRequest) {
      this.logger.debug('AuthInterceptor: Adding Authorization header', { url: request.url, token });
      // Only set Content-Type if not FormData
      if (!(request.body instanceof FormData)) {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
      } else {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
      }
    } else if (isApiRequest) {
      this.logger.debug('AuthInterceptor: No token or public request, sending basic headers', { url: request.url, isDemoRequest });
      if (!(request.body instanceof FormData)) {
        request = request.clone({
          setHeaders: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
      } else {
        request = request.clone({
          setHeaders: {
            'Accept': 'application/json'
          }
        });
      }
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Don't handle auth errors for demo or auth requests
        const isDemoRequest = request.url.includes('isDemo=true');
        
        // Gérer les erreurs d'authentification
        if (error.status === 401 && !isAuthRequest && !isDemoRequest) {
          this.logger.warn('Token invalide ou expiré pour une requête protégée');
          
          // Vérifier si l'utilisateur était vraiment connecté
          if (this.authService.isAuthenticated()) {
            this.authService.logout();
            this.router.navigate(['/auth/login'], {
              queryParams: { 
                error: 'session_expired',
                returnUrl: this.router.url 
              }
            });
          }
        }
        
        // Gérer les erreurs de permissions (skip for demo)
        if (error.status === 403 && !isDemoRequest) {
          this.logger.warn('Permissions insuffisantes');
          this.router.navigate(['/'], {
            queryParams: { error: 'access_denied' }
          });
        }
        
        return throwError(() => error);
      })
    );
  }
}