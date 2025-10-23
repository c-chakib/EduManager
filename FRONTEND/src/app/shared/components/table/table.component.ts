import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overflow-hidden rounded-lg border border-gray-200">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <!-- Header -->
          <thead class="bg-gray-50">
            <tr>
              <th
                *ngFor="let column of columns"
                [style.width]="column.width"
                [class]="getHeaderClasses(column)"
                scope="col"
              >
                <button
                  *ngIf="column.sortable"
                  (click)="onSort(column.key)"
                  class="group inline-flex items-center gap-2 hover:text-gray-900 transition-colors"
                  type="button"
                >
                  {{ column.label }}
                  <span class="flex flex-col">
                    <i 
                      class="pi pi-angle-up text-xs -mb-1"
                      [class.text-blue-600]="sortKey === column.key && sortDirection === 'asc'"
                      [class.text-gray-400]="sortKey !== column.key || sortDirection !== 'asc'"
                    ></i>
                    <i 
                      class="pi pi-angle-down text-xs"
                      [class.text-blue-600]="sortKey === column.key && sortDirection === 'desc'"
                      [class.text-gray-400]="sortKey !== column.key || sortDirection !== 'desc'"
                    ></i>
                  </span>
                </button>
                <span *ngIf="!column.sortable">{{ column.label }}</span>
              </th>
            </tr>
          </thead>

          <!-- Body -->
          <tbody class="bg-white divide-y divide-gray-200">
            <ng-content></ng-content>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div *ngIf="empty" class="py-12 text-center text-gray-500">
        <i class="pi pi-inbox text-4xl mb-3 text-gray-400"></i>
        <p class="font-medium">{{ emptyMessage }}</p>
      </div>

      <!-- Footer Slot -->
      <div *ngIf="hasFooter" class="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `,
  styles: []
})
export class TableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() empty = false;
  @Input() emptyMessage = 'Aucune donnée disponible';
  @Input() hasFooter = false;
  @Input() sortKey?: string;
  @Input() sortDirection: 'asc' | 'desc' = 'asc';
  
  @Output() sort = new EventEmitter<{ key: string; direction: 'asc' | 'desc' }>();

  onSort(key: string) {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }
    
    this.sort.emit({ key: this.sortKey, direction: this.sortDirection });
  }

  getHeaderClasses(column: TableColumn): string {
    const baseClasses = 'px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider';
    
    const alignClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    };
    
    return `${baseClasses} ${alignClasses[column.align || 'left']}`;
  }
}
