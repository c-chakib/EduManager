import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RecentActivityService, RecentActivity } from '../../services/recent-activity.service';

@Component({
  selector: 'app-recent-activity',
  standalone: false,
  templateUrl: './recent-activity.component.html',
  styleUrl: './recent-activity.component.css'
})
export class RecentActivityComponent implements OnInit, OnDestroy {
  activities: RecentActivity[] = [];
  private subscription = new Subscription();

  constructor(private recentActivityService: RecentActivityService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.recentActivityService.activities$.subscribe(activities => {
        this.activities = activities;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getActivityIcon(type: string): string {
    return this.recentActivityService.getActivityIcon(type);
  }

  getActivityTypeLabel(type: string): string {
    return this.recentActivityService.getActivityTypeLabel(type);
  }

  formatRelativeTime(date: Date): string {
    return this.recentActivityService.formatRelativeTime(date);
  }

  clearAllActivities(): void {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les activités récentes ?')) {
      this.recentActivityService.clearAllActivities();
    }
  }

  trackByActivityId(index: number, activity: RecentActivity): string {
    return activity.id;
  }
}
