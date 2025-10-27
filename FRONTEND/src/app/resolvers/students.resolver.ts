import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EtudiantsServiceService } from '../etudiants/etudiants-service.service';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../core/services/logger.service';
import { ResolverData } from './data.resolver';

export interface StudentsResolverData extends ResolverData {
  data: {
    students: any[];
    total: number;
    page: number;
    limit: number;
    user: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StudentsResolver implements Resolve<StudentsResolverData> {

  constructor(
    private studentsService: EtudiantsServiceService,
    private authService: AuthService,
    private logger: LoggerService
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<StudentsResolverData> {
    this.logger.info('StudentsResolver: Resolving students data');

    // Get query parameters for pagination/filtering
    const page = +route.queryParams['page'] || 1;
    const limit = +route.queryParams['limit'] || 12;
    const search = route.queryParams['search'];
    const matieres = route.queryParams['matieres']?.split(',') || [];
    const sortBy = route.queryParams['sortBy'];

    // Get current user info
    const currentUser = this.authService.getCurrentUser();

    return this.studentsService.getStudentList(page, limit, search, matieres, sortBy).pipe(
      map(response => ({
        data: {
          students: response.data,
          total: response.total,
          page: response.page,
          limit: response.limit,
          user: currentUser
        },
        loading: false,
        error: null,
        timestamp: Date.now()
      })),
      catchError(error => {
        this.logger.error('StudentsResolver: Error loading students', error);
        return of({
          data: {
            students: [],
            total: 0,
            page: 1,
            limit: 12,
            user: currentUser
          },
          loading: false,
          error: error.message || 'Failed to load students',
          timestamp: Date.now()
        });
      })
    );
  }
}