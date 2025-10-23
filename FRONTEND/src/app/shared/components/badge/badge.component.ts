import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClasses">
      <i *ngIf="icon" [class]="icon + ' mr-1'"></i>
      <ng-content></ng-content>
      <button 
        *ngIf="closable"
        (click)="onClose()"
        class="ml-1.5 hover:bg-black/10 rounded-full p-0.5 transition-colors"
        type="button"
      >
        <i class="pi pi-times text-xs"></i>
      </button>
    </span>
  `,
  styles: []
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'primary';
  @Input() size: BadgeSize = 'md';
  @Input() icon?: string;
  @Input() closable = false;
  @Input() rounded: 'sm' | 'md' | 'lg' | 'full' = 'full';
  @Input() outline = false;

  onClose() {
    // Emit close event
  }

  get badgeClasses(): string {
    const baseClasses = 'inline-flex items-center font-semibold transition-all duration-200';
    
    // Size classes
    const sizeClasses = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base'
    };
    
    // Variant classes
    const solidVariantClasses = {
      primary: 'bg-blue-100 text-blue-800',
      secondary: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      danger: 'bg-red-100 text-red-800',
      warning: 'bg-yellow-100 text-yellow-800',
      info: 'bg-cyan-100 text-cyan-800'
    };
    
    const outlineVariantClasses = {
      primary: 'bg-white border-2 border-blue-500 text-blue-700',
      secondary: 'bg-white border-2 border-gray-500 text-gray-700',
      success: 'bg-white border-2 border-green-500 text-green-700',
      danger: 'bg-white border-2 border-red-500 text-red-700',
      warning: 'bg-white border-2 border-yellow-500 text-yellow-700',
      info: 'bg-white border-2 border-cyan-500 text-cyan-700'
    };
    
    // Rounded classes
    const roundedClasses = {
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      full: 'rounded-full'
    };
    
    const variantClass = this.outline ? outlineVariantClasses[this.variant] : solidVariantClasses[this.variant];
    
    return `${baseClasses} ${sizeClasses[this.size]} ${variantClass} ${roundedClasses[this.rounded]}`;
  }
}
