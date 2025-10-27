import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EtudiantsServiceService } from '../etudiants/etudiants-service.service';
import { LoggerService } from '../core/services/logger.service';
import { ResolverData } from './data.resolver';

export interface StudentDetailResolverData extends ResolverData {
  data: any; // Individual student data
}

@Injectable({
  providedIn: 'root'
})
export class StudentDetailResolver implements Resolve<StudentDetailResolverData> {

  constructor(
    private studentsService: EtudiantsServiceService,
    private logger: LoggerService,
    private router: Router
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<StudentDetailResolverData> {
    const studentId = route.params['id'];

    if (!studentId) {
      this.logger.warn('StudentDetailResolver: No student ID provided');
      this.router.navigate(['/etudiants']);
      return of({
        data: null,
        loading: false,
        error: 'No student ID provided',
        timestamp: Date.now()
      });
    }

    this.logger.info(`StudentDetailResolver: Resolving student data for ID ${studentId}`);

    return this.studentsService.getStudentById(+studentId).pipe(
      map(student => {
        if (!student) {
          // Student not found - return error state
          return {
            data: null,
            loading: false,
            error: 'Student not found',
            timestamp: Date.now()
          };
        }
        return {
          data: student,
          loading: false,
          error: null,
          timestamp: Date.now()
        };
      }),
      catchError(error => {
        this.logger.error(`StudentDetailResolver: Error loading student ${studentId}`, error);

        // Return error state instead of navigating in resolver
        return of({
          data: null,
          loading: false,
          error: error.status === 404 ? 'Student not found' : (error.message || 'Failed to load student details'),
          timestamp: Date.now()
        });
      })
    );
  }
}