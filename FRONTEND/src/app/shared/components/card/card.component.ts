import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses">
      <!-- Header -->
      <div *ngIf="title || hasHeaderContent" [class]="headerClasses">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <i *ngIf="icon" [class]="icon + ' text-2xl'"></i>
            <div>
              <h3 *ngIf="title" class="text-lg font-bold text-gray-900">{{ title }}</h3>
              <p *ngIf="subtitle" class="text-sm text-gray-600 mt-1">{{ subtitle }}</p>
            </div>
          </div>
          <ng-content select="[header-actions]"></ng-content>
        </div>
        <ng-content select="[header]"></ng-content>
      </div>

      <!-- Body -->
      <div [class]="bodyClasses">
        <ng-content></ng-content>
      </div>

      <!-- Footer -->
      <div *ngIf="hasFooterContent" [class]="footerClasses">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
  styles: []
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() variant: 'default' | 'bordered' | 'elevated' | 'flat' = 'default';
  @Input() padding: 'none' | 'sm' | 'md' | 'lg' = 'md';
  @Input() hover = false;
  @Input() clickable = false;
  
  hasHeaderContent = false;
  hasFooterContent = false;

  ngAfterContentInit() {
    // Check for projected content (simplified)
    this.hasHeaderContent = true;
    this.hasFooterContent = true;
  }

  get cardClasses(): string {
    const baseClasses = 'rounded-lg transition-all duration-200';
    
    const variantClasses = {
      default: 'bg-white shadow-md',
      bordered: 'bg-white border-2 border-gray-200',
      elevated: 'bg-white shadow-xl',
      flat: 'bg-gray-50'
    };
    
    const hoverClass = this.hover ? 'hover:shadow-xl hover:-translate-y-1' : '';
    const clickableClass = this.clickable ? 'cursor-pointer' : '';
    
    return `${baseClasses} ${variantClasses[this.variant]} ${hoverClass} ${clickableClass}`;
  }

  get headerClasses(): string {
    const paddingClasses = {
      none: 'p-0',
      sm: 'px-3 py-2',
      md: 'px-4 py-3',
      lg: 'px-6 py-4'
    };
    
    return `${paddingClasses[this.padding]} border-b border-gray-200`;
  }

  get bodyClasses(): string {
    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6'
    };
    
    return paddingClasses[this.padding];
  }

  get footerClasses(): string {
    const paddingClasses = {
      none: 'p-0',
      sm: 'px-3 py-2',
      md: 'px-4 py-3',
      lg: 'px-6 py-4'
    };
    
    return `${paddingClasses[this.padding]} border-t border-gray-200 bg-gray-50/50`;
  }
}
