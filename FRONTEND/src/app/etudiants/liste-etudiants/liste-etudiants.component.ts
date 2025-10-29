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
import { environment } from '../../../environments/environment';

type SortKey = 'nom_asc' | 'nom_desc' | 'prenom_asc' | 'prenom_desc' | 'id_asc' | 'id_desc' | 'date_desc' | 'date_asc';

@Component({
  selector: 'app-liste-etudiants',
  standalone: false,
  templateUrl: './liste-etudiants.component.html',
  styleUrls: ['./liste-etudiants.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ListeEtudiantsComponent implements OnInit {
  // Fetch all matières from backend for dropdown
  async fetchAllMatieres() {
    try {
  const resp = await fetch(`${environment.apiUrl}/etudiants/matieres/list`, {
        method: 'GET',
        credentials: 'include'
      });
      if (!resp.ok) return;
      const matieres = await resp.json();
      // Expecting array of strings
      this.matieresDisponibles = Array.isArray(matieres) ? matieres : [];
      this.updateMatieresOptions();
    } catch (err) {
      console.error('Failed to fetch all matieres:', err);
    }
  }
  matieresOptions: { label: string, value: string }[] = [];
  selectedMatieres: string[] = [];
  // Called when matières filter changes (PrimeNG p-multiSelect)
  onMatieresFilterChange() {
    this.pageIndex = 0;
    this.loadStudents();
  }
  // Bulk import: open file dialog and send to backend
  openBulkImportDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
        const resp = await fetch(`${environment.apiUrl}/bulk-import`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        const result = await resp.json();
        if (resp.ok) {
          this.toastService.success(`Import terminé : ${result.inserted} ajoutés, ${result.errors.length} erreurs.`);
          this.loadStudents();
        } else {
          this.toastService.error(result.message || 'Erreur lors de l\'import.');
        }
      } catch (err) {
        this.toastService.error('Erreur réseau lors de l\'import.');
      }
    };
    input.click();
  }

  // Bulk export: download template from backend
  async exportStudentsTemplate() {
    const url = `${environment.apiUrl}/etudiants/bulk-export-template`;
    const token = this.authService.getToken && this.authService.getToken();
    try {
      const resp = await fetch(url, {
        method: 'GET',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      if (!resp.ok) {
        const error = await resp.json();
        this.toastService.error(error.message || 'Erreur lors du téléchargement du template.');
        return;
      }
      const blob = await resp.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'etudiants_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      this.toastService.info('Téléchargement du template CSV...');
    } catch (err) {
      this.toastService.error('Erreur réseau lors du téléchargement du template.');
    }
  }
  private destroy$ = new Subject<void>();

  EtudiantsListe: Etudiants[] = [];
  // Demo mode detection
  isDemoMode = false;
  loading = false;
  error = '';
  totalCount = 0; // Total number of students from API

  // UI state
    // Export only selected students as CSV
    async exportSelectedStudents() {
      if (!this.selectedStudents || this.selectedStudents.length === 0) {
        this.toastService.info('Veuillez sélectionner au moins un étudiant à exporter.');
        return;
      }
      const ids = this.selectedStudents.map(s => s.id);
      try {
        // Get JWT token from AuthService
        const token = this.authService.getToken && this.authService.getToken();
        const resp = await fetch(`${environment.apiUrl}/etudiants/export-selected`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ ids }),
          credentials: 'include'
        });
        if (!resp.ok) {
          const error = await resp.json();
          this.toastService.error(error.message || 'Erreur lors de l\'export.');
          return;
        }
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'etudiants_selection.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.toastService.success('Export des étudiants sélectionnés terminé.');
      } catch (err) {
        this.toastService.error('Erreur réseau lors de l\'export.');
      }
    }
  searchTerm = '';
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

  // Removed toggleMatiereDropdown (handled by PrimeNG)

  // Delete confirmation
  showDeleteConfirm = false;
  studentToDelete: Etudiants | null = null;

  // filters data
  matieresDisponibles: string[] = [];

  // Remove custom dropdown state (handled by PrimeNG)

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

  // Helper method to get proper photo URL
  getPhotoUrl(photo: string | null | undefined, etudiant: Etudiants): string {
    if (!photo) {
      return `https://ui-avatars.com/api/?name=${etudiant.prenom || 'Student'}+${etudiant.nom || ''}&size=200&background=3b82f6&color=fff`;
    }
    
    // If it's already a full URL, return it
    if (photo.startsWith('http')) {
      return photo;
    }
    
    // If it already starts with /uploads/, construct the full URL
    if (photo.startsWith('/uploads/')) {
      return `${environment.apiUrl}${photo}`;
    }
    
    // If it's just a filename, construct the full URL using the API URL
    return `${environment.apiUrl}/uploads/etudiants/${photo}`;
  }

  // Handle image loading errors
  handleImageError(event: any, etudiant: Etudiants): void {
    event.target.style.display = 'none';
  }

  // Removed HostListener for custom dropdown closing (handled by PrimeNG)

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

    // Detect demo mode from router URL (works for both direct and lazy-loaded routes)
  this.isDemoMode = this.router.url.includes('/demo/etudiants') || !!(this.route.snapshot.routeConfig?.path?.includes('demo/etudiants'));

    // Always fetch all matieres for dropdown
    this.fetchAllMatieres();
    if (this.isDemoMode) {
      this.logger.debug('Demo mode detected in ngOnInit, loading demo students');
      this.loadDemoStudents();
    } else {
      // Initial load - use resolved data if available
      const resolvedData = this.route.snapshot.data['studentsData'] as StudentsResolverData;
      if (resolvedData && resolvedData.data && !resolvedData.error) {
        this.EtudiantsListe = this.normalizeStudentData(resolvedData.data.students || []);
        this.totalCount = resolvedData.data.total || 0;
        this.loading = false;
        this.logger.debug('Using resolved student data', { count: this.EtudiantsListe.length, total: this.totalCount });
      } else {
        this.loadStudents();
      }
    }
  }

  updateMatieresOptions() {
    // Normalize for backend filtering: value is lowercase, accent-free
        this.matieresOptions = (this.matieresDisponibles || []).map(m => ({
          label: m,
          value: m.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    }));
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

    // Use isDemoMode property for demo mode detection
    if (this.isDemoMode) {
      this.logger.debug('Demo mode detected in loadStudents, loading demo data');
      this.loadDemoStudents();
      return;
    }

    // Call backend with all filters
    // Send only normalized values to backend
        const matieresForApi = this.selectedMatieres.length > 0
          ? this.selectedMatieres.map((m: any) => m && typeof m === 'object' && 'value' in m ? m.value : m)
          : undefined;
    this.serv.getStudentList(
      this.pageIndex + 1,
      this.pageSize,
      this.searchTerm,
      matieresForApi,
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

          // FIX: Use normalized data with proper photo URLs
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

          // Build unique matières for filter dropdown and update options
    this.matieresDisponibles = this.extractUniqueMatieres(this.EtudiantsListe);
    console.log('Loaded matieresDisponibles:', this.matieresDisponibles);
    this.updateMatieresOptions();

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
      ...s, // FIX: Create new object to avoid reference issues
      matieres: this.getMatieresArray(s.matieres) // FIX: Use the fixed matieres parser
    }));
  }

  // Fixed matieres parser for list component
  private getMatieresArray(matieres: any): string[] {
    if (!matieres) return [];
    
    // If it's already a proper array, return it
    if (Array.isArray(matieres)) {
      return matieres.filter(m => m && typeof m === 'string');
    }
    
    // If it's a string, try to parse it
    if (typeof matieres === 'string') {
      try {
        // Clean the string - remove excessive escaping
        let cleanedString = matieres;
        
        // Remove multiple levels of escaping
        while (cleanedString.startsWith('"') || cleanedString.startsWith('[') || cleanedString.includes('\\"')) {
          try {
            const parsed = JSON.parse(cleanedString);
            if (typeof parsed === 'string') {
              cleanedString = parsed;
            } else if (Array.isArray(parsed)) {
              return this.flattenMatieres(parsed);
            } else {
              break;
            }
          } catch {
            cleanedString = cleanedString.replace(/^"+|"+$/g, '')
                                         .replace(/\\"/g, '"')
                                         .replace(/^\[|\]$/g, '');
            break;
          }
        }
        
        // Final cleanup and split
        const finalClean = cleanedString.replace(/^"+|"+$/g, '')
                                       .replace(/\\"/g, '"')
                                       .replace(/^\[|\]$/g, '');
        
        // Split by comma and clean each item
        const items = finalClean.split(',')
          .map(item => item.trim()
            .replace(/^"+|"+$/g, '')
            .replace(/^'|'$/g, '')
          )
          .filter(item => item.length > 0);
        
        return items;
      } catch (error) {
        console.error('Error parsing matieres:', error);
        return [];
      }
    }
    
    return [];
  }

  // Helper to flatten nested matieres arrays
  private flattenMatieres(arr: any[]): string[] {
    const result: string[] = [];
    
    const flatten = (array: any[]) => {
      array.forEach(item => {
        if (Array.isArray(item)) {
          flatten(item);
        } else if (typeof item === 'string' && item.trim().length > 0) {
          const cleaned = item.trim()
            .replace(/^"+|"+$/g, '')
            .replace(/^'|'$/g, '');
          if (cleaned && !result.includes(cleaned)) {
            result.push(cleaned);
          }
        }
      });
    };
    
    flatten(arr);
    return result;
  }

  private extractUniqueMatieres(students: Etudiants[]): string[] {
    const set = new Set<string>();
    students.forEach(s => {
      let matieresArr: string[] = [];
      if (Array.isArray(s.matieres)) {
        matieresArr = s.matieres as string[];
      } else if (typeof s.matieres === 'string') {
        matieresArr = (s.matieres as string).split(',').map((m: string) => m.trim()).filter((m: string) => m);
      }
      matieresArr.forEach((m: string) => set.add(m));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }

  // UI Helper Methods
  // Removed toggleMatiere (handled by p-multiSelect)

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