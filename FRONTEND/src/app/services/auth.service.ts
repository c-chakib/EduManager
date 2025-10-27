import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, tap, map } from 'rxjs';
import { Router } from '@angular/router';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';
import { environment } from '../../environments/environment';
import { LoggerService } from '../core/services/logger.service';
import { StorageService } from '../core/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}${environment.apiEndpoints.users}`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  // Event to notify when pending users change (approval/rejection)
  private pendingUsersChanged = new Subject<void>();
  public pendingUsersChanged$ = this.pendingUsersChanged.asObservable();

  /**
   * Expose current user role
   */
  public get role(): 'admin' | 'user' | 'moderator' | 'teacher' | 'student' | 'super-admin' | null {
    return this.getCurrentUser()?.role ?? null;
  }

  /**
   * Helper to get current user role
   */
  getRole(): 'admin' | 'user' | 'moderator' | 'teacher' | 'student' | 'super-admin' | null {
    return this.getCurrentUser()?.role ?? null;
  }

  constructor(
    private http: HttpClient,
    private router: Router,
    private logger: LoggerService,
    private storage: StorageService
  ) {
    // Vérifier si l'utilisateur est déjà connecté au démarrage
    this.checkInitialAuthState();
  }

  private checkInitialAuthState(): void {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    this.logger.debug('Vérification de l\'état initial d\'authentification', { hasToken: !!token, hasUser: !!user });
    
    if (token && user) {
      // Vérifier si le token n'est pas expiré
      if (!this.isTokenExpired(token)) {
        this.logger.info('Session valide trouvée, restauration de l\'état');
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } else {
        this.logger.warn('Token expiré, nettoyage des données');
        this.clearAuthData();
      }
    } else {
      this.logger.debug('Aucune session trouvée, utilisateur non connecté');
      // S'assurer que l'état est cohérent
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData).pipe(
      tap(response => {
        this.logger.info('Inscription réussie', response);
        // Auto-login seulement si le compte n'est pas en attente d'approbation
        if (!(response as any).requiresApproval) {
          this.handleAuthSuccess(response);
          // Always refresh user info after registration
          this.refreshCurrentUser().subscribe();
        }
      })
    );
  }

  /**
   * Connexion d'un utilisateur
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        this.logger.info('Connexion réussie', response);
        this.handleAuthSuccess(response);
        // Always refresh user info after login
        this.refreshCurrentUser().subscribe();
      })
    );
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.logger.debug('Déconnexion en cours...');
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Rediriger seulement si on n'est pas déjà sur une page d'auth
    const currentUrl = this.router.url;
    if (!currentUrl.includes('/auth/')) {
      this.router.navigate(['/auth/login']);
    }
    
    this.logger.debug('Déconnexion effectuée');
  }

  /**
   * Refresh current user from backend (sync role/status changes)
   */
  refreshCurrentUser(): Observable<User> {
    return this.http.get<{success: boolean, data: User}>(`${this.API_URL}/me`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.storage.setUser(response.data);
          this.currentUserSubject.next(response.data);
          this.logger.info('User data refreshed', response.data);
        }
      }),
      map(response => response.data)
    );
  }

  /**
   * Obtenir le token JWT
   */
  getToken(): string | null {
    return this.storage.getToken();
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  updateProfile(userData: Partial<User>): Observable<any> {
    return this.http.put<{success: boolean, data: User, message: string}>(`${this.API_URL}/profile`, userData).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Update stored user data
          this.storage.setUser(response.data);
          this.currentUserSubject.next(response.data);
          this.logger.info('Profil mis à jour', response.data);
        }
      })
    );
  }

  /**
   * Change password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<{success: boolean, message: string}> {
    return this.http.put<{success: boolean, message: string}>(
      `${this.API_URL}/change-password`, 
      { currentPassword, newPassword }
    );
  }

  /**
   * Get pending users (super-admin only)
   */
  getPendingUsers(): Observable<{success: boolean, data: User[], count: number}> {
    return this.http.get<{success: boolean, data: User[], count: number}>(`${this.API_URL}/pending`);
  }

  /**
   * Approve user (super-admin only)
   */
  approveUser(userId: string): Observable<{success: boolean, message: string, data: User}> {
    return this.http.put<{success: boolean, message: string, data: User}>(`${this.API_URL}/${userId}/approve`, {}).pipe(
      tap(() => this.pendingUsersChanged.next())
    );
  }

  /**
   * Reject user (super-admin only)
   */
  rejectUser(userId: string, reason: string): Observable<{success: boolean, message: string, data: User}> {
    return this.http.put<{success: boolean, message: string, data: User}>(`${this.API_URL}/${userId}/reject`, { reason }).pipe(
      tap(() => this.pendingUsersChanged.next())
    );
  }

  /**
   * Get all users for management (super-admin only)
   */
  getAllUsersManagement(filters?: {status?: string, role?: string, search?: string, page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'}): Observable<{success: boolean, data: User[], count: number, meta?: any}> {
    const params: any = {};
    if (filters?.status) params.status = filters.status;
    if (filters?.role) params.role = filters.role;
    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.page = filters.page;
    if (filters?.limit) params.limit = filters.limit;
    if (filters?.sortBy) params.sortBy = filters.sortBy;
    if (filters?.sortOrder) params.sortOrder = filters.sortOrder;
    return this.http.get<{success: boolean, data: User[], count: number, meta?: any}>(`${this.API_URL}/management`, { params });
  }

  /**
   * Update any user (super-admin only)
   */
  updateUserById(userId: string, userData: Partial<User>): Observable<{success: boolean, message: string, data: User}> {
    return this.http.put<{success: boolean, message: string, data: User}>(`${this.API_URL}/management/${userId}`, userData);
  }

  /**
   * Delete user (super-admin only)
   */
  deleteUserById(userId: string): Observable<{success: boolean, message: string}> {
    return this.http.delete<{success: boolean, message: string}>(`${this.API_URL}/management/${userId}`);
  }

  /** Suspend user (super-admin only) */
  suspendUser(userId: string, reason?: string): Observable<{success: boolean, message: string, data: User}> {
    return this.http.put<{success: boolean, message: string, data: User}>(`${this.API_URL}/management/${userId}/suspend`, { reason });
  }

  /** Reactivate user (super-admin only) */
  reactivateUser(userId: string): Observable<{success: boolean, message: string, data: User}> {
    return this.http.put<{success: boolean, message: string, data: User}>(`${this.API_URL}/management/${userId}/reactivate`, {});
  }

  /**
   * Google Sign-In
   */
  googleSignIn(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/google-signin`, { idToken }).pipe(
      tap(response => {
        this.logger.info('Google login successful', response);
        this.handleAuthSuccess(response);
        // Always refresh user info after login
        this.refreshCurrentUser().subscribe();
      })
    );
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  getCurrentUser(): User | null {
    return this.storage.getUser<User>();
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && !this.isTokenExpired(token);
  }

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   */
  hasRole(role: 'user' | 'admin'): boolean {
    const user = this.getCurrentUser();
    return user?.role === role || false;
  }

  /**
   * Vérifier si l'utilisateur est admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Gérer le succès d'authentification
   */
  private handleAuthSuccess(response: AuthResponse): void {
    // Stocker le token et les données utilisateur
    this.storage.setToken(response.token);
    this.storage.setUser(response.user);
    
    // Mettre à jour les observables
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
    
    // Rediriger vers la page principale
    this.router.navigate(['/']);
  }

  /**
   * Nettoyer les données d'authentification
   */
  private clearAuthData(): void {
    this.storage.clearAuthData();
  }

  /**
   * Vérifier si le token est expiré
   */
  private isTokenExpired(token: string): boolean {
    if (!token || token.split('.').length !== 3) {
      this.logger.debug('Token invalide ou malformé');
      return true;
    }

    try {
      const payload = this.decodeJwtPayload(token);
      const currentTime = Date.now() / 1000;
      const isExpired = payload.exp < currentTime;
      
      if (isExpired) {
        this.logger.debug('Token expiré', new Date(payload.exp * 1000));
      } else {
        this.logger.debug('Token valide', { expiresAt: new Date(payload.exp * 1000) });
      }
      
      return isExpired;
    } catch (error) {
      this.logger.error('Erreur lors de la vérification du token', error);
      return true;
    }
  }

  /**
   * Obtenir les informations du token
   */
  getTokenInfo(): any {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      return this.decodeJwtPayload(token);
    } catch (error) {
      this.logger.error('Erreur lors du décodage du token', error);
      return null;
    }
  }

  /**
   * Rafraîchir les données utilisateur
   */
  refreshUserData(): void {
    const user = this.getCurrentUser();
    if (user && this.isAuthenticated()) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  /**
   * Decode JWT payload with base64url support
   */
  private decodeJwtPayload(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('JWT malformé');
    const base64Url = parts[1];
    // Convert base64url -> base64 and pad
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const json = atob(padded);
    return JSON.parse(json);
  }
}