import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ToastService, Toast } from '../../services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ],
  template: `
    <!-- Toast Container - Fixed Position -->
    <div class="toast-container">
      <div
        *ngFor="let toast of visibleToasts"
        [class]="getToastClasses(toast)"
        [@slideIn]
      >
        <div class="toast-content">
          <!-- Icon -->
          <div class="toast-icon">
            <i [class]="getIconClass(toast.variant)"></i>
          </div>

          <!-- Content -->
          <div class="toast-text">
            <h4 *ngIf="toast.title" class="toast-title">{{ toast.title }}</h4>
            <p class="toast-message">{{ toast.message }}</p>
          </div>

          <!-- Close Button -->
          <button 
            *ngIf="toast.closable"
            (click)="removeToast(toast.id)"
            class="toast-close"
            type="button"
            aria-label="Fermer"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>

        <!-- Progress Bar (if duration exists) -->
        <div *ngIf="toast.duration" class="toast-progress">
          <div 
            class="toast-progress-bar"
            [style.animation-duration.ms]="toast.duration"
          ></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
      pointer-events: none;
    }

    .toast-container > div {
      pointer-events: auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      min-width: 320px;
    }

    .toast-content {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
    }

    .toast-icon {
      flex-shrink: 0;
      font-size: 1.25rem;
      margin-top: 0.125rem;
    }

    .toast-text {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 700;
      font-size: 0.875rem;
      margin: 0 0 0.25rem 0;
    }

    .toast-message {
      font-size: 0.875rem;
      margin: 0;
      line-height: 1.4;
    }

    .toast-close {
      flex-shrink: 0;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      opacity: 0.6;
      transition: opacity 0.2s;
      color: currentColor;
    }

    .toast-close:hover {
      opacity: 1;
    }

    /* Variant Styles */
    .toast-success {
      border-left: 4px solid #10b981;
      background: #f0fdf4;
      color: #065f46;
    }

    .toast-success .toast-icon {
      color: #10b981;
    }

    .toast-error {
      border-left: 4px solid #ef4444;
      background: #fef2f2;
      color: #991b1b;
    }

    .toast-error .toast-icon {
      color: #ef4444;
    }

    .toast-warning {
      border-left: 4px solid #f59e0b;
      background: #fffbeb;
      color: #92400e;
    }

    .toast-warning .toast-icon {
      color: #f59e0b;
    }

    .toast-info {
      border-left: 4px solid #3b82f6;
      background: #eff6ff;
      color: #1e40af;
    }

    .toast-info .toast-icon {
      color: #3b82f6;
    }

    /* Progress Bar */
    .toast-progress {
      height: 4px;
      background: rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .toast-progress-bar {
      height: 100%;
      background: currentColor;
      animation: shrink linear forwards;
    }

    @keyframes shrink {
      from {
        width: 100%;
      }
      to {
        width: 0%;
      }
    }

    /* Responsive */
    @media (max-width: 640px) {
      .toast-container {
        left: 1rem;
        right: 1rem;
        max-width: none;
      }

      .toast-container > div {
        min-width: auto;
      }
    }
  `]
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private destroy$ = new Subject<void>();

  constructor(private toastService: ToastService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.toastService.toasts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(toasts => {
        this.toasts = toasts;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  removeToast(id: string) {
    this.toastService.remove(id);
  }

  get visibleToasts(): Toast[] {
    return this.toasts.filter(t => !!t.message);
  }

  getToastClasses(toast: Toast): string {
    const variantClasses = {
      success: 'toast-success',
      error: 'toast-error',
      warning: 'toast-warning',
      info: 'toast-info'
    };
    
    return variantClasses[toast.variant] || 'toast-info';
  }

  getIconClass(variant: Toast['variant']): string {
    const icons = {
      success: 'pi pi-check-circle',
      error: 'pi pi-times-circle',
      warning: 'pi pi-exclamation-triangle',
      info: 'pi pi-info-circle'
    };
    
    return icons[variant];
  }
}
