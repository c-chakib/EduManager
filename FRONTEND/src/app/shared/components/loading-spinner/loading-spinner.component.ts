import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses">
      <div [class]="spinnerClasses">
        <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <p *ngIf="message" [class]="messageClasses">{{ message }}</p>
    </div>
  `,
  styles: []
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() color: 'primary' | 'white' | 'gray' = 'primary';
  @Input() centered = false;
  @Input() overlay = false;
  @Input() message?: string;

  get containerClasses(): string {
    const baseClasses = 'flex flex-col items-center justify-center gap-3';
    const centeredClass = this.centered ? 'min-h-[400px]' : '';
    const overlayClass = this.overlay ? 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50' : '';
    
    return `${baseClasses} ${centeredClass} ${overlayClass}`;
  }

  get spinnerClasses(): string {
    const sizeClasses = {
      sm: 'w-6 h-6',
      md: 'w-10 h-10',
      lg: 'w-16 h-16',
      xl: 'w-24 h-24'
    };
    
    const colorClasses = {
      primary: 'text-blue-600',
      white: 'text-white',
      gray: 'text-gray-600'
    };
    
    return `${sizeClasses[this.size]} ${colorClasses[this.color]}`;
  }

  get messageClasses(): string {
    const colorClasses = {
      primary: 'text-gray-700',
      white: 'text-white',
      gray: 'text-gray-600'
    };
    
    return `text-sm font-medium ${colorClasses[this.color]}`;
  }
}
