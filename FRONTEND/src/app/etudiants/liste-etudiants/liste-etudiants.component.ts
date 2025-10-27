import { Component, OnInit, ChangeDetectionStrategy, ElementRef, HostListener } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, switchMap, filter } from 'rxjs';
import { Etudiants } from '../etudiants';
import { EtudiantsServiceService } from '../etudiants-service.service';
import { SocketService } from '../../services/socket.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../shared/services/toast.service';
import { StudentsResolverData } from '../../resolvers/students.resolver';

type SortKey = 'nom_asc' | 'nom_desc' | 'prenom_asc' | 'prenom_desc' | 'id_asc' | 'id_desc' | 'date_desc' | 'date_asc';

@Component({
  selector: 'app-liste-etudiants',
  standalone: false,
  templateUrl: './liste-etudiants.component.html',
  styleUrls: ['./liste-etudiants.component.css'],
  changeDetection: ChangeDetectionStrategy.Default // Keep Default for now due to getters; can optimize further if needed
})
export class ListeEtudiantsComponent implements OnInit {
  private destroy$ = new Subject<void>();

  EtudiantsListe: Etudiants[] = [];
  loading = false;
  error = '';
  totalCount = 0; // Total number of students from API

  // UI state
  searchTerm = '';
  selectedMatieres: string[] = [];
  sortBy: SortKey = 'nom_asc';

  // Bulk selection
  selectAll = false;
  selectedStudents: Etudiants[] = [];

  pageIndex = 0;
  pageSize = 10;

  get pagedEtudiants(): Etudiants[] {
    return this.EtudiantsListe;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  onPageSizeChange(newSize?: number) {
    if (typeof newSize === 'number') {
      this.pageSize = newSize;
    }
    this.pageIndex = 0;
    this.loadStudents(); // Reload with new page size
  }

  nextPage() {
    if ((this.pageIndex + 1) < this.totalPages) {
      this.pageIndex++;
      this.loadStudents(); // Load next page
    }
  }

  prevPage() {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.loadStudents(); // Load previous page
    }
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.pageIndex = page;
      this.loadStudents(); // Load new page from API
    }
  }

  getVisiblePages(): number[] {
    const totalPages = this.totalPages;
    const currentPage = this.pageIndex;
    const visiblePages: number[] = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      visiblePages.push(i);
    }
    return visiblePages;
  }

  clearFilters() {
    this.searchTerm = '';
    this.searchControl.setValue('', { emitEvent: false }); // Update control without triggering valueChanges
    this.selectedMatieres = [];
    this.sortBy = 'nom_asc';
    this.pageIndex = 0;
    this.loadStudents(); // Reload with cleared filters
  }

  clearSearch() {
    this.searchControl.setValue(''); // This will trigger the debounced search automatically
  }

  toggleMatiereDropdown() {
    this.showMatiereDropdown = !this.showMatiereDropdown;
  }

  // Delete confirmation
  showDeleteConfirm = false;
  studentToDelete: Etudiants | null = null;

  // filters data
  matieresDisponibles: string[] = [];

  // matiere dropdown state
  showMatiereDropdown = false;

  // reactive search control used in template
  searchControl: FormControl = new FormControl('');

  // pagination options
  pageSizeOptions = [8, 12, 24, 48];

  // skeletons
  skeletonItems = Array.from({ length: 8 });
  getSkeletons() {
    const count = Math.max(1, Math.min(this.pageSize, 48));
    return Array.from({ length: count });
  }

  constructor(
    private serv: EtudiantsServiceService, 
    public router: Router,
    private logger: LoggerService,
    public authService: AuthService,
    private toastService: ToastService,
    private elRef: ElementRef<HTMLElement>,
    private socketService: SocketService,
    private route: ActivatedRoute
  ) {}

  // Close matières dropdown on outside click
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.showMatiereDropdown) return;
    const target = event.target as Node;
    const filterEl = this.elRef.nativeElement.querySelector('.matiere-filter');
    if (filterEl && !filterEl.contains(target)) {
      this.showMatiereDropdown = false;
    }
  }

  ngOnInit() {
    // Reactive search with debounceTime and switchMap
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300), // Wait 300ms after user stops typing
        distinctUntilChanged(), // Only emit if value changed
        takeUntil(this.destroy$)
      )
      .subscribe((value: any) => {
        this.searchTerm = (value || '').toString();
        this.pageIndex = 0; // Reset to first page
        this.loadStudents(); // Trigger API call with filters
      });

    // Subscribe to students changes (create, update, delete)
    // This handles refreshes when navigating back from form pages
    this.serv.studentsChanged$
      .pipe(
        debounceTime(100), // Small delay to avoid duplicate calls
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.logger.debug('Students changed event received, reloading list');
        this.loadStudents(); // Refresh the list
      });

    // Listen to navigation events to reload when returning to list
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        filter((event: NavigationEnd) => event.url === '/etudiants' || event.url.startsWith('/etudiants?')),
        debounceTime(50), // Small delay to ensure component is ready
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.logger.debug('Navigated to students list, reloading');
        this.loadStudents();
      });

    // Listen for real-time student events from Socket.io
    this.socketService.onStudentCreated().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.logger.info('Real-time: student created event received');
      this.loadStudents();
    });
    this.socketService.onStudentUpdated().pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.logger.info('Real-time: student updated event received');
      this.loadStudents();
    });
    this.socketService.onStudentDeleted().pipe(takeUntil(this.destroy$)).subscribe((event) => {
      const eventTime = Date.now();
      this.logger.info('Real-time: student deleted event received', { event, eventTime });
      // Optimistic UI: remove the student from the list immediately
      if (event && event.student && event.student.id) {
        this.EtudiantsListe = this.EtudiantsListe.filter(s => s.id !== event.student.id);
        this.totalCount = Math.max(0, this.totalCount - 1);
      }
      // Then sync with backend, and log timing
      this.loadStudents(eventTime);
    });

    // Initial load - use resolved data if available
    const resolvedData = this.route.snapshot.data['studentsData'] as StudentsResolverData;
    if (resolvedData && resolvedData.data && !resolvedData.error) {
      this.EtudiantsListe = resolvedData.data.students || [];
      this.totalCount = resolvedData.data.total || 0;
      this.loading = false;
      this.logger.debug('Using resolved student data', { count: this.EtudiantsListe.length, total: this.totalCount });
    } else {
      // Fallback: load data if resolver didn't provide it
      this.loadStudents();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Main method to load students with all filters applied
  private loadStudents(eventTime?: number) {
    const startTime = Date.now();
    this.logger.debug('Loading students with filters', {
      search: this.searchTerm,
      matieres: this.selectedMatieres,
      sortBy: this.sortBy,
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      eventTime,
      startTime
    });

    this.loading = true;
    this.error = '';

    // Check if we're in demo mode (public route)
    const isDemoMode = this.router.url.includes('/demo/');

    if (isDemoMode) {
      this.logger.debug('Demo mode detected, loading demo data');
      this.loadDemoStudents();
      return;
    }

    // Call backend with all filters
    this.serv.getStudentList(
      this.pageIndex + 1, // API uses 1-based pagination
      this.pageSize,
      this.searchTerm,
      this.selectedMatieres.length > 0 ? this.selectedMatieres : undefined,
      this.sortBy
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          const endTime = Date.now();
          this.logger.debug('Received filtered student data', {
            count: resp.data.length,
            total: resp.total,
            page: resp.page,
            filters: { search: this.searchTerm, matieres: this.selectedMatieres },
            eventTime,
            startTime,
            endTime,
            socketToHttp: startTime - (eventTime || startTime),
            httpDuration: endTime - startTime
          });

          // ...existing code...
          if (resp.data.length > 0) {
            this.logger.debug('First 3 students received', {
              students: resp.data.slice(0, 3).map(s => ({
                id: s.id,
                nom: s.nom,
                isDemo: (s as any).isDemo
              }))
            });
          }

          // Backend now handles demo filtering, no need to filter here in authenticated mode
          this.EtudiantsListe = this.normalizeStudentData(resp.data);
          // Fallback numeric sort on ID for UI reliability in UI
          if (this.sortBy.startsWith('id_')) {
            const dir = this.sortBy.endsWith('_desc') ? -1 : 1;
            this.EtudiantsListe = [...this.EtudiantsListe].sort((a, b) => {
              const aId = typeof a.id === 'number' ? a.id : Number.MAX_SAFE_INTEGER;
              const bId = typeof b.id === 'number' ? b.id : Number.MAX_SAFE_INTEGER;
              if (aId === bId) return 0;
              return aId < bId ? -1 * dir : 1 * dir;
            });
          }
          try {
            const ids = this.EtudiantsListe.slice(0, 5).map(s => s.id);
            this.logger.debug('First IDs after apply', { sortBy: this.sortBy, ids });
          } catch {}
          this.totalCount = resp.total || resp.data.length;

          // Build unique matières for filter dropdown
          this.matieresDisponibles = this.extractUniqueMatieres(this.EtudiantsListe);

          this.loading = false;
        },
        error: (err: any) => {
          this.logger.error('Failed to load student list', err);
          this.error = 'Impossible de charger la liste des étudiants.';
          this.loading = false;
          this.toastService.error('Erreur lors du chargement des étudiants');
        }
      });
  }

  // Public method for manual reload
  reload() {
    this.loadStudents();
  }

  private loadDemoStudents() {
    // Demo mode: charger les étudiants de démo depuis l'API (MongoDB) avec filtre isDemo=true
    this.logger.debug('Demo mode detected, loading demo students from API');
    this.serv.getStudentList(1, 100, undefined, undefined, undefined, { isDemo: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.logger.debug('Received demo student data', { count: resp.data.length, total: resp.total });
          this.EtudiantsListe = this.normalizeStudentData(resp.data);
          if (this.sortBy.startsWith('id_')) {
            const dir = this.sortBy.endsWith('_desc') ? -1 : 1;
            this.EtudiantsListe = [...this.EtudiantsListe].sort((a, b) => {
              const aId = typeof a.id === 'number' ? a.id : Number.MAX_SAFE_INTEGER;
              const bId = typeof b.id === 'number' ? b.id : Number.MAX_SAFE_INTEGER;
              if (aId === bId) return 0;
              return aId < bId ? -1 * dir : 1 * dir;
            });
          }
          try {
            const ids = this.EtudiantsListe.slice(0, 5).map(s => s.id);
            this.logger.debug('First demo IDs after apply', { sortBy: this.sortBy, ids });
          } catch {}
          this.totalCount = resp.total;
          this.matieresDisponibles = this.extractUniqueMatieres(this.EtudiantsListe);
          this.loading = false;
        },
        error: (err) => {
          this.logger.error('Failed to load demo student list', err);
          this.error = 'Impossible de charger la liste des étudiants de démo.';
          this.loading = false;
        }
      });
  }

  // Helper methods for better code organization
  private normalizeStudentData(students: Etudiants[]): Etudiants[] {
    return students.map(s => ({
      ...s,
      matieres: Array.isArray(s.matieres)
        ? s.matieres
        : typeof (s as any).matieres === 'string'
          ? (s as any).matieres.split(',').map((x: string) => x.trim()).filter(Boolean)
          : Array.isArray((s as any)['matières'])
            ? (s as any)['matières']
            : []
    }));
  }

  private extractUniqueMatieres(students: Etudiants[]): string[] {
    const set = new Set<string>();
    students.forEach(s => (s.matieres || []).forEach(m => set.add(m)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }

  // UI Helper Methods
  toggleMatiere(m: string) {
    const idx = this.selectedMatieres.indexOf(m);
    if (idx === -1) this.selectedMatieres.push(m);
    else this.selectedMatieres.splice(idx, 1);
    this.pageIndex = 0;
    this.loadStudents(); // Trigger API call with new filters
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.loadStudents(); // Trigger API call with new filters
  }

  getEmptyStateTitle(): string {
    if (this.searchTerm) return 'Aucun résultat pour votre recherche';
    if (this.selectedMatieres.length > 0) return 'Aucun étudiant pour ces matières';
    return 'Aucun étudiant trouvé';
  }

  getEmptyStateMessage(): string {
    if (this.searchControl.value) return `Aucun étudiant trouvé pour "${this.searchControl.value}".`;
    if (this.selectedMatieres.length > 0) return `Aucun étudiant assigné aux matières sélectionnées.`;
    if (this.router.url.includes('/demo/')) return 'Le mode démonstration ne contient pas encore d\'autres étudiants.';
    return 'Vous pouvez ajouter des étudiants en cliquant sur le bouton Ajouter un étudiant.';
  }

  setSortBy(field: 'nom' | 'prenom' | 'id') {
    const currentField = this.sortBy.split('_')[0];
    const currentDirection = this.sortBy.split('_')[1];
    
    if (currentField === field) {
      const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
      this.sortBy = `${field}_${newDirection}` as SortKey;
    } else {
      this.sortBy = `${field}_asc` as SortKey;
    }
    
    this.pageIndex = 0;
    this.loadStudents(); // Trigger API call with new sort
  }

  getSortDirection(field: 'nom' | 'prenom' | 'id'): 'asc' | 'desc' | null {
    const currentField = this.sortBy.split('_')[0];
    const currentDirection = this.sortBy.split('_')[1] as 'asc' | 'desc';
    return currentField === field ? currentDirection : null;
  }

  trackById(index: number, item: Etudiants) {
    return (item.id as any) ?? (item as any)._id ?? index;
  }

  addNewStudent() {
    this.router.navigate(['/etudiants/form']);
  }

  goToDetailsPage(id: number) {
    const isDemoMode = this.router.url.includes('/demo/');
    if (isDemoMode) {
      this.router.navigate(['/demo/etudiants', id]);
    } else {
      this.router.navigate(['/etudiants', id]);
    }
  }

  getDetailsRoute(id: number): string[] {
    const isDemoMode = this.router.url.includes('/demo/');
    return isDemoMode ? ['/demo/etudiants', id.toString()] : ['/etudiants', id.toString()];
  }

  editStudent(etudiant: Etudiants) {
    this.router.navigate(['/etudiants/edit', etudiant.id]);
  }

  openDeleteConfirm(etudiant: Etudiants) {
    this.studentToDelete = etudiant;
    this.showDeleteConfirm = true;
  }

  confirmDeleteStudent() {
    if (!this.studentToDelete?.id) return;
    
    this.loading = true;
    this.serv.deleteStudent(this.studentToDelete.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Étudiant supprimé avec succès');
          this.showDeleteConfirm = false;
          this.studentToDelete = null;
          this.loadStudents(); // Immediate reload for instant feedback
        },
        error: (err: any) => {
          this.logger.error('Failed to delete student', err);
          this.toastService.error('Erreur lors de la suppression');
          this.loading = false;
        }
      });
  }

  toggleSelectAll() {
    this.pagedEtudiants.forEach(e => (e as any).selected = this.selectAll);
    this.selectedStudents = this.selectAll ? [...this.pagedEtudiants] : [];
  }

  toggleStudentSelection(etudiant: Etudiants) {
    (etudiant as any).selected = !(etudiant as any).selected;
    this.selectedStudents = this.pagedEtudiants.filter((e: any) => e.selected);
    this.selectAll = this.selectedStudents.length === this.pagedEtudiants.length;
  }

  get isShowingAll(): boolean {
    return this.pageSize >= this.totalCount;
  }

  get displayInfo(): string {
    const total = this.totalCount;
    if (total === 0) return '0 sur 0';
    const start = this.pageIndex * this.pageSize + 1;
    const end = Math.min((this.pageIndex + 1) * this.pageSize, total);
    return `${start}-${end} sur ${total}`;
  }

  getPageNumbers(): (number | string)[] {
    const total = this.totalPages;
    const current = this.pageIndex;
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current < 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current > total - 4) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current; i <= current + 2; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  }

  isNumber(value: any): boolean {
    return typeof value === 'number';
  }

  // Helper method to check if user can edit/delete students
  canEditStudents(): boolean {
    const role = this.authService.role;
    return role === 'admin' || role === 'super-admin';
  }
}