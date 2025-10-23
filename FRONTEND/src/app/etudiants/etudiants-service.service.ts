import { Injectable } from '@angular/core';
import { catchError, Observable, tap, of, Subject } from 'rxjs';
import { Etudiants } from './etudiants';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { LoggerService } from '../core/services/logger.service';

@Injectable({
  providedIn: 'root'
})
export class EtudiantsServiceService {
  private readonly apiUrl = `${environment.apiUrl}${environment.apiEndpoints.etudiants}`;
  
  // Subject to notify when students list should be refreshed
  private studentsChanged = new Subject<void>();
  public studentsChanged$ = this.studentsChanged.asObservable();

  constructor(
    private http: HttpClient,
    private logger: LoggerService
  ) {}

  getStudentList(
    page = 1, 
    limit = 12, 
    search?: string, 
    matieres?: string[], 
    sortBy?: string,
    filters?: { isDemo?: boolean }
  ): Observable<{ data: Etudiants[]; total: number; page: number; limit: number }> {
    // Build query parameters
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    
    if (search && search.trim()) {
      url += `&search=${encodeURIComponent(search.trim())}`;
    }
    
    // Handle multiple matieres as comma-separated string
    if (matieres && matieres.length > 0) {
      const matieresString = matieres.filter(m => m && m !== 'all').join(',');
      if (matieresString) {
        url += `&matiere=${encodeURIComponent(matieresString)}`;
      }
    }
    
    if (sortBy) {
      url += `&sortBy=${encodeURIComponent(sortBy)}`;
    }

    if (filters?.isDemo !== undefined) {
      url += `&isDemo=${filters.isDemo}`;
    }
    
    this.logger.debug('Fetching student list (paginated)', { url, page, limit, search, matieres, sortBy });
    return this.http.get<{ data: Etudiants[]; total: number; page: number; limit: number }>(url).pipe(
      tap((resp) => {
        this.logger.info('Fetched student list successfully', { count: resp.data.length, total: resp.total });
      }),
      catchError(error => {
        this.logger.error('Error fetching student list', error);
        return of({ data: [], total: 0, page, limit });
      })
    );
  }

  getStudentById(id: number): Observable<Etudiants> {
    return this.http.get<Etudiants>(`${this.apiUrl}/${id}`).pipe(
      tap((resp) => this.logger.debug('Fetched student details', resp)),
      catchError(error => {
        this.logger.error('Error fetching student details', error);
        throw error;
      })
    );
  }

  updateStudent(id: number, etudiant: Etudiants): Observable<Etudiants> {
    return this.http.put<Etudiants>(`${this.apiUrl}/${id}`, etudiant).pipe(
      tap((resp) => {
        this.logger.info('Updated student', { id, student: resp });
        this.studentsChanged.next(); // Notify listeners that students list changed
      }),
      catchError(error => {
        this.logger.error('Error updating student', error);
        throw error;
      })
    );
  }

  deleteStudent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.logger.info('Deleted student', { id });
        this.studentsChanged.next(); // Notify listeners that students list changed
      }),
      catchError(error => {
        this.logger.error('Error deleting student', error);
        throw error;
      })
    );
  }

  createStudent(etudiant: Etudiants): Observable<Etudiants> {
    return this.http.post<Etudiants>(this.apiUrl, etudiant).pipe(
      tap((resp) => {
        this.logger.info('Created student', resp);
        this.studentsChanged.next(); // Notify listeners that students list changed
      }),
      catchError(error => {
        this.logger.error('Error creating student', error);
        throw error;
      })
    );
  }

  // Récupérer la liste des matières prédéfinies
  getAllMatieres(): Observable<string[]> {
    const url = `${environment.apiUrl}${environment.apiEndpoints.matieres}`;
    return this.http.get<string[]>(url).pipe(
      tap((resp) => this.logger.debug('Fetched matieres list', { count: resp.length })),
      catchError(error => {
        this.logger.error('Error fetching matieres list', error);
        return of([]);
      })
    );
  }
}
