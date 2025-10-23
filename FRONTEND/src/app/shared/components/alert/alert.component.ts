import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="alertClasses" role="alert">
      <div class="flex items-start gap-3">
        <!-- Icon -->
        <div class="flex-shrink-0 mt-0.5">
          <i [class]="iconClass + ' text-xl'"></i>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h4 *ngIf="title" class="font-bold text-sm mb-1">{{ title }}</h4>
          <div class="text-sm">
            <ng-content></ng-content>
          </div>
        </div>

        <!-- Close Button -->
        <button 
          *ngIf="closable"
          (click)="onClose()"
          class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          type="button"
        >
          <i class="pi pi-times"></i>
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class AlertComponent {
  @Input() variant: AlertVariant = 'info';
  @Input() title?: string;
  @Input() closable = true;
  @Input() bordered = false;
  
  @Output() closed = new EventEmitter<void>();

  onClose() {
    this.closed.emit();
  }

  get alertClasses(): string {
    const baseClasses = 'p-4 rounded-lg';
    
    const variantClasses = {
      success: this.bordered 
        ? 'bg-green-50 border-l-4 border-green-500 text-green-800'
        : 'bg-green-100 text-green-800',
      error: this.bordered 
        ? 'bg-red-50 border-l-4 border-red-500 text-red-800'
        : 'bg-red-100 text-red-800',
      warning: this.bordered 
        ? 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800'
        : 'bg-yellow-100 text-yellow-800',
      info: this.bordered 
        ? 'bg-blue-50 border-l-4 border-blue-500 text-blue-800'
        : 'bg-blue-100 text-blue-800'
    };
    
    return `${baseClasses} ${variantClasses[this.variant]}`;
  }

  get iconClass(): string {
    const icons = {
      success: 'pi pi-check-circle text-green-600',
      error: 'pi pi-times-circle text-red-600',
      warning: 'pi pi-exclamation-triangle text-yellow-600',
      info: 'pi pi-info-circle text-blue-600'
    };
    
    return icons[this.variant];
  }
}
