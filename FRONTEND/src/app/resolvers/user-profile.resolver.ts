import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../core/services/logger.service';
import { ResolverData } from './data.resolver';

export interface UserProfileResolverData extends ResolverData {
  data: any; // User profile data
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileResolver implements Resolve<UserProfileResolverData> {

  constructor(
    private authService: AuthService,
    private logger: LoggerService,
    private router: Router
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<UserProfileResolverData> {
    this.logger.info('UserProfileResolver: Resolving user profile data');

    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.logger.warn('UserProfileResolver: No authenticated user found');
      this.router.navigate(['/auth/login']);
      return of({
        data: null,
        loading: false,
        error: 'User not authenticated',
        timestamp: Date.now()
      });
    }

    // For now, just return the current user data
    // In a real app, you might fetch additional profile data from the server
    return of({
      data: currentUser,
      loading: false,
      error: null,
      timestamp: Date.now()
    });
  }
}