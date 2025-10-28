import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-journal-log',
  templateUrl: './journal-log.component.html',
  standalone: false,
  styleUrls: ['./journal-log.component.css']
})
export class JournalLogComponent implements OnInit {
  getSelectedCount(): number {
    return this.selected ? this.selected.filter(s => s).length : 0;
  }

  journals: any[] = [];
  loading = true;
  error = '';

  startDate: string = '';
  endDate: string = '';
  userFilter: string = '';
  actionFilter: string = '';

  selected: boolean[] = [];
  selectAll: boolean = false;

  getSelectedLogs(): any[] {
    return this.selected && this.selected.some((sel: boolean) => sel)
      ? this.journals.filter((_, i) => this.selected[i])
      : [];
  }

  toggleSelectAll(): void {
    this.selected = this.journals.map(() => this.selectAll);
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchJournals();
  }

  fetchJournals(): void {
    this.loading = true;
    let params: any = {};
    if (this.startDate) params.start = this.startDate;
    if (this.endDate) params.end = this.endDate;
    if (this.userFilter) params.user = this.userFilter;
    if (this.actionFilter) params.action = this.actionFilter;
    this.http.get<any[]>(`${environment.apiUrl}/journal`, { params }).subscribe({
      next: (data) => {
        this.journals = data;
        this.selected = data.map(() => false);
        this.selectAll = false;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Erreur lors du chargement du journal';
        this.loading = false;
      }
    });
  }

  // Update filter and fetch journals immediately
  onFilterChange(): void {
    this.fetchJournals();
  }

  resetFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.userFilter = '';
    this.actionFilter = '';
    this.fetchJournals();
  }
}
