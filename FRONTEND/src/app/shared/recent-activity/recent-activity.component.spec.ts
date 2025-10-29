import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecentActivityComponent } from './recent-activity.component';
import { RecentActivityService } from '../../services/recent-activity.service';
import { of } from 'rxjs';

describe('RecentActivityComponent', () => {
  let component: RecentActivityComponent;
  let fixture: ComponentFixture<RecentActivityComponent>;
  let recentActivityServiceSpy: jasmine.SpyObj<RecentActivityService>;

  beforeEach(async () => {
    recentActivityServiceSpy = jasmine.createSpyObj('RecentActivityService', [
      'getActivityIcon', 'getActivityTypeLabel', 'formatRelativeTime', 'clearAllActivities'], {
        activities$: of([])
      }
    );
    await TestBed.configureTestingModule({
      declarations: [RecentActivityComponent],
      providers: [
        { provide: RecentActivityService, useValue: recentActivityServiceSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecentActivityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getActivityIcon', () => {
    recentActivityServiceSpy.getActivityIcon.and.returnValue('icon');
    expect(component.getActivityIcon('test')).toBe('icon');
  });

  it('should call getActivityTypeLabel', () => {
    recentActivityServiceSpy.getActivityTypeLabel.and.returnValue('label');
    expect(component.getActivityTypeLabel('test')).toBe('label');
  });

  it('should call formatRelativeTime', () => {
    recentActivityServiceSpy.formatRelativeTime.and.returnValue('1 min ago');
    expect(component.formatRelativeTime(new Date())).toBe('1 min ago');
  });

  it('should call clearAllActivities', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.clearAllActivities();
    expect(recentActivityServiceSpy.clearAllActivities).toHaveBeenCalled();
  });
});
