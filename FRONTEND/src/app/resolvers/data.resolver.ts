import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';
import { LoggerService } from '../core/services/logger.service';

export interface ResolverData<T = any> {
  data: T;
  loading: boolean;
  error: string | null;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataResolver implements Resolve<ResolverData> {

  constructor(
    private logger: LoggerService,
    private router: Router
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<ResolverData> {
    // Get resolver configuration from route data
    const resolverConfig = route.data['resolver'] as ResolverConfig;

    if (!resolverConfig) {
      this.logger.warn('DataResolver: No resolver configuration found in route data');
      return of({
        data: null,
        loading: false,
        error: 'No resolver configuration provided',
        timestamp: Date.now()
      });
    }

    this.logger.info(`DataResolver: Resolving data for route ${state.url}`);

    return resolverConfig.dataSource.pipe(
      take(1), // Take only the first emission
      map(data => ({
        data,
        loading: false,
        error: null,
        timestamp: Date.now()
      })),
      catchError(error => {
        this.logger.error('DataResolver: Error resolving data', error);

        // Handle different error types
        if (resolverConfig.onError === 'redirect') {
          this.router.navigate([resolverConfig.redirectTo || '/']);
          return of({
            data: null,
            loading: false,
            error: 'Redirecting due to error',
            timestamp: Date.now()
          });
        }

        if (resolverConfig.onError === 'throw') {
          return throwError(() => error);
        }

        // Default: return error in data
        return of({
          data: resolverConfig.defaultValue || null,
          loading: false,
          error: error.message || 'An error occurred while loading data',
          timestamp: Date.now()
        });
      })
    );
  }
}

export interface ResolverConfig {
  dataSource: Observable<any>;
  onError?: 'redirect' | 'throw' | 'return';
  redirectTo?: string;
  defaultValue?: any;
}