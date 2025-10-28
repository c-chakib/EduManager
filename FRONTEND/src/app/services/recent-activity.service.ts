import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface RecentActivity {
  id: string;
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'user_status_changed';
  action: string;
  details: string;
  userId: string;
  userName: string;
  performedBy: string;
  performedByName?: string;
  timestamp: Date;
  expiresAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class RecentActivityService {
  private readonly STORAGE_KEY = 'recent_activities';
  private readonly EXPIRY_HOURS = 24;

  private activitiesSubject = new BehaviorSubject<RecentActivity[]>([]);
  public activities$ = this.activitiesSubject.asObservable();

  constructor() {
    this.loadActivities();
    this.cleanupExpiredActivities();
  }

  // Add a new activity
  addActivity(activity: Omit<RecentActivity, 'id' | 'timestamp' | 'expiresAt'>): void {
    // Fallback logic for performedByName
    let performedByName = activity.performedByName;
    if (!performedByName || performedByName === 'Utilisateur') {
      performedByName = activity.performedBy || 'Utilisateur';
    }
    const newActivity: RecentActivity = {
      ...activity,
      performedByName,
      id: this.generateId(),
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + this.EXPIRY_HOURS * 60 * 60 * 1000)
    };

    const activities = this.getActivities();
    activities.unshift(newActivity); // Add to beginning

    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.splice(100);
    }

    this.saveActivities(activities);
    this.activitiesSubject.next(activities);
  }

  // Get all activities
  getActivities(): RecentActivity[] {
    return this.activitiesSubject.value;
  }

  // Clear all activities
  clearAllActivities(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.activitiesSubject.next([]);
  }

  // Clear expired activities
  private cleanupExpiredActivities(): void {
    const activities = this.getActivities();
    const now = new Date();
    const validActivities = activities.filter(activity =>
      new Date(activity.expiresAt) > now
    );

    if (validActivities.length !== activities.length) {
      this.saveActivities(validActivities);
      this.activitiesSubject.next(validActivities);
    }
  }

  // Load activities from localStorage
  private loadActivities(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const activities: RecentActivity[] = JSON.parse(stored).map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp),
          expiresAt: new Date(activity.expiresAt)
        }));

        // Filter out expired activities
        const now = new Date();
        const validActivities = activities.filter(activity =>
          new Date(activity.expiresAt) > now
        );

        this.activitiesSubject.next(validActivities);
      }
    } catch (error) {
      console.error('Error loading activities from localStorage:', error);
      this.activitiesSubject.next([]);
    }
  }

  // Save activities to localStorage
  private saveActivities(activities: RecentActivity[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activities));
    } catch (error) {
      console.error('Error saving activities to localStorage:', error);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Get activity type label
  getActivityTypeLabel(type: string): string {
    switch (type) {
      case 'user_created':
        return 'Utilisateur créé';
      case 'user_updated':
        return 'Utilisateur modifié';
      case 'user_deleted':
        return 'Utilisateur supprimé';
      case 'user_status_changed':
        return 'Statut modifié';
      default:
        return 'Activité';
    }
  }

  // Get activity icon
  getActivityIcon(type: string): string {
    switch (type) {
      case 'user_created':
        return 'pi pi-user-plus';
      case 'user_updated':
        return 'pi pi-user-edit';
      case 'user_deleted':
        return 'pi pi-user-minus';
      case 'user_status_changed':
        return 'pi pi-info-circle';
      default:
        return 'pi pi-bell';
    }
  }

  // Format relative time
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    return `Il y a ${diffDays} j`;
  }
}