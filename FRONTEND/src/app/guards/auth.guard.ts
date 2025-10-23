import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../core/services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private logger: LoggerService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          const requiredRoles = route.data['roles'] as Array<'user' | 'admin' | 'super-admin'>;
          
          if (requiredRoles && requiredRoles.length > 0) {
            const user = this.authService.getCurrentUser();
            if (user?.role === 'super-admin') {
              return true;
            }
            const hasRequiredRole = requiredRoles.includes(user?.role as any);
            if (!hasRequiredRole) {
              this.logger.warn('Accès refusé: rôle insuffisant', { requiredRoles, userRole: user?.role });
              this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url, error: 'insufficient_role' } });
              return false;
            }
          }
          return true;
        } else {
          this.logger.warn('Accès refusé: utilisateur non authentifié');
          this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private logger: LoggerService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (!isAuthenticated) {
          this.logger.warn('Accès refusé: utilisateur non authentifié');
          this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
          return false;
        }
        const requiredRoles = route.data['roles'] as Array<'user' | 'admin' | 'super-admin'>;
        const userRole = this.authService.role;
        if (userRole === 'super-admin') {
          return true;
        }
        if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(userRole as any)) {
          this.logger.warn('Accès refusé: rôle insuffisant', { requiredRoles, userRole });
          this.router.navigate(['/']);
          return false;
        }
        return true;
      })
    );
  }
}

@Injectable({
  providedIn: 'root'
})
export class NoAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> | boolean {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          this.router.navigate(['/']);
          return false;
        }
        return true;
      })
    );
  }
}
