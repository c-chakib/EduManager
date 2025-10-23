import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses">
      <div class="text-center max-w-md mx-auto space-y-4">
        <!-- Icon or Image -->
        <div *ngIf="icon || image" class="flex justify-center">
          <div *ngIf="icon" [class]="iconContainerClasses">
            <i [class]="icon + ' text-4xl'"></i>
          </div>
          <img *ngIf="image && !icon" [src]="image" [alt]="title" class="w-48 h-48 object-contain opacity-50" />
        </div>

        <!-- Title -->
        <h3 class="text-xl font-bold text-gray-900">{{ title }}</h3>

        <!-- Description -->
        <p *ngIf="description" class="text-gray-600">{{ description }}</p>

        <!-- Action Button -->
        <div *ngIf="actionText" class="pt-4">
          <ng-content select="[action]"></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class EmptyStateComponent {
  @Input() icon?: string;
  @Input() image?: string;
  @Input() title: string = 'Aucune donnée disponible';
  @Input() description?: string;
  @Input() actionText?: string;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get containerClasses(): string {
    const sizeClasses = {
      sm: 'py-8',
      md: 'py-16',
      lg: 'py-24'
    };
    
    return `flex items-center justify-center ${sizeClasses[this.size]}`;
  }

  get iconContainerClasses(): string {
    return 'w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-400';
  }
}
