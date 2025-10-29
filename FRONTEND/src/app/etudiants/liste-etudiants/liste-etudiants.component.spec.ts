import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, Subject, BehaviorSubject, throwError } from 'rxjs';

import { ListeEtudiantsComponent } from './liste-etudiants.component';
import { AuthService } from '../../services/auth.service';
import { EtudiantsServiceService } from '../etudiants-service.service';
import { SocketService } from '../../services/socket.service';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../shared/services/toast.service';
import { Etudiants } from '../etudiants';

describe('ListeEtudiantsComponent', () => {
  let component: ListeEtudiantsComponent;
  let fixture: ComponentFixture<ListeEtudiantsComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockEtudiantsService: jasmine.SpyObj<EtudiantsServiceService>;
  let mockSocketService: jasmine.SpyObj<SocketService>;
  let mockLoggerService: jasmine.SpyObj<LoggerService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;

  const mockStudents: Etudiants[] = [
    { id: 1, nom: 'Doe', prenom: 'John', mail: 'john@example.com', photo: '', matieres: ['Math', 'Physics'] },
    { id: 2, nom: 'Smith', prenom: 'Jane', mail: 'jane@example.com', photo: '', matieres: ['Chemistry'] }
  ];

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken'], {
      get role() { return 'admin'; }
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      get url() { return '/etudiants'; },
      events: new Subject()
    });
    const etudiantsServiceSpy = jasmine.createSpyObj('EtudiantsServiceService', ['getStudentList', 'deleteStudent'], {
      studentsChanged$: new Subject()
    });
    const socketServiceSpy = jasmine.createSpyObj('SocketService', [
      'onStudentCreated', 'onStudentUpdated', 'onStudentDeleted'
    ]);
    const loggerServiceSpy = jasmine.createSpyObj('LoggerService', ['debug', 'info', 'error']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'info']);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', [], {
      snapshot: {
        routeConfig: { path: '' },
        data: {
          studentsData: {
            data: { students: mockStudents, total: 2 },
            error: null
          }
        }
      }
    });

    await TestBed.configureTestingModule({
      declarations: [ListeEtudiantsComponent],
      imports: [HttpClientTestingModule, FormsModule, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: EtudiantsServiceService, useValue: etudiantsServiceSpy },
        { provide: SocketService, useValue: socketServiceSpy },
        { provide: LoggerService, useValue: loggerServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ListeEtudiantsComponent);
    component = fixture.componentInstance;

    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockEtudiantsService = TestBed.inject(EtudiantsServiceService) as jasmine.SpyObj<EtudiantsServiceService>;
    mockSocketService = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    mockLoggerService = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockActivatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;

    // Setup default mock returns
    mockEtudiantsService.getStudentList.and.returnValue(of({
      data: mockStudents,
      total: 2,
      page: 1,
      limit: 10
    }));
    mockSocketService.onStudentCreated.and.returnValue(of());
    mockSocketService.onStudentUpdated.and.returnValue(of());
    mockSocketService.onStudentDeleted.and.returnValue(of());
  });

  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.EtudiantsListe).toEqual([]);
      expect(component.loading).toBeFalse();
      expect(component.error).toBe('');
      expect(component.totalCount).toBe(0);
      expect(component.pageIndex).toBe(0);
      expect(component.pageSize).toBe(10);
      expect(component.sortBy).toBe('nom_asc');
      expect(component.searchTerm).toBe('');
      expect(component.selectAll).toBeFalse();
      expect(component.selectedStudents).toEqual([]);
    });
  });

  describe('ngOnInit', () => {
    beforeEach(() => {
      spyOn(component, 'fetchAllMatieres');
    });

    it('should initialize component with resolved data', () => {
      component.ngOnInit();

      expect(component.EtudiantsListe).toEqual(mockStudents);
      expect(component.totalCount).toBe(2);
      expect(component.loading).toBeFalse();
      expect(component.fetchAllMatieres).toHaveBeenCalled();
    });

    it('should setup reactive search with debounce', fakeAsync(() => {
      component.ngOnInit();
      component.searchControl.setValue('test search');

      tick(300); // Wait for debounce

      expect(component.searchTerm).toBe('test search');
      expect(component.pageIndex).toBe(0);
      expect(mockEtudiantsService.getStudentList).toHaveBeenCalled();
    }));

    it('should subscribe to students changed events', fakeAsync(() => {
      component.ngOnInit();

      (mockEtudiantsService.studentsChanged$ as Subject<void>).next();
      tick(100); // Wait for debounce

      expect(mockEtudiantsService.getStudentList).toHaveBeenCalled();
    }));

    it('should handle navigation events', fakeAsync(() => {
      component.ngOnInit();

      (mockRouter.events as Subject<any>).next(new NavigationEnd(1, '/etudiants', '/etudiants'));
      tick(50); // Wait for debounce

      expect(mockEtudiantsService.getStudentList).toHaveBeenCalled();
    }));

    it('should subscribe to socket events', () => {
      component.ngOnInit();

      expect(mockSocketService.onStudentCreated).toHaveBeenCalled();
      expect(mockSocketService.onStudentUpdated).toHaveBeenCalled();
      expect(mockSocketService.onStudentDeleted).toHaveBeenCalled();
    });
  });

  describe('User Permissions', () => {
    it('should return true for admin role', () => {
      Object.defineProperty(mockAuthService, 'role', { value: 'admin' });
      expect(component.canEditStudents()).toBeTrue();
    });

    it('should return true for super-admin role', () => {
      Object.defineProperty(mockAuthService, 'role', { value: 'super-admin' });
      expect(component.canEditStudents()).toBeTrue();
    });

    it('should return false for non-admin roles', () => {
      Object.defineProperty(mockAuthService, 'role', { value: 'user' });
      expect(component.canEditStudents()).toBeFalse();

      Object.defineProperty(mockAuthService, 'role', { value: 'teacher' });
      expect(component.canEditStudents()).toBeFalse();
    });
  });

  describe('Navigation Methods', () => {
    it('should navigate to add new student form', () => {
      component.addNewStudent();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/etudiants/form']);
    });

    it('should navigate to student details', () => {
      component.goToDetailsPage(1);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/etudiants', 1]);
    });

    it('should navigate to demo student details when in demo mode', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/demo/etudiants' });
      component.goToDetailsPage(1);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/demo/etudiants', 1]);
    });

    it('should navigate to edit student', () => {
      const student = mockStudents[0];
      component.editStudent(student);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/etudiants/edit', student.id]);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      component.totalCount = 25;
      component.pageSize = 10;
    });

    it('should calculate total pages correctly', () => {
      expect(component.totalPages).toBe(3);
    });

    it('should navigate to next page', () => {
      component.nextPage();
      expect(component.pageIndex).toBe(1);
      expect(mockEtudiantsService.getStudentList).toHaveBeenCalled();
    });

    it('should not navigate beyond total pages', () => {
      component.pageIndex = 2; // Last page
      component.nextPage();
      expect(component.pageIndex).toBe(2); // Should not change
    });

    it('should navigate to previous page', () => {
      component.pageIndex = 1;
      component.prevPage();
      expect(component.pageIndex).toBe(0);
      expect(mockEtudiantsService.getStudentList).toHaveBeenCalled();
    });

    it('should not navigate before first page', () => {
      component.pageIndex = 0;
      component.prevPage();
      expect(component.pageIndex).toBe(0); // Should not change
    });

    it('should go to specific page', () => {
      component.goToPage(1);
      expect(component.pageIndex).toBe(1);
      expect(mockEtudiantsService.getStudentList).toHaveBeenCalled();
    });

    it('should not go to invalid pages', () => {
      component.goToPage(-1);
      expect(component.pageIndex).toBe(0); // Should not change

      component.goToPage(10);
      expect(component.pageIndex).toBe(0); // Should not change
    });

    it('should change page size', () => {
      component.onPageSizeChange(24);
      expect(component.pageSize).toBe(24);
      expect(component.pageIndex).toBe(0);
      expect(mockEtudiantsService.getStudentList).toHaveBeenCalled();
    });
  });

  describe('Student Selection', () => {
    beforeEach(() => {
      component.EtudiantsListe = [...mockStudents];
      // Reset selected properties
      component.EtudiantsListe.forEach(s => (s as any).selected = false);
      component.selectedStudents = [];
      component.selectAll = false;
    });

    it('should toggle select all', () => {
      component.selectAll = true;
      component.toggleSelectAll();

      expect((component.pagedEtudiants[0] as any).selected).toBeTrue();
      expect((component.pagedEtudiants[1] as any).selected).toBeTrue();
      expect(component.selectedStudents).toEqual(component.pagedEtudiants);
    });

    it('should toggle individual student selection', () => {
      const student = mockStudents[0];
      component.toggleStudentSelection(student);

      expect((student as any).selected).toBeTrue();
      expect(component.selectedStudents).toEqual([student]);
      expect(component.selectAll).toBeFalse();
    });

    it('should update selectAll when all students are selected', () => {
      component.toggleStudentSelection(mockStudents[0]);
      component.toggleStudentSelection(mockStudents[1]);

      expect(component.selectAll).toBeTrue();
    });
  });

  describe('Filtering and Search', () => {
    it('should clear search', () => {
      component.searchControl.setValue('test');
      component.clearSearch();

      expect(component.searchControl.value).toBe('');
      // loadStudents should be called via the reactive form subscription
    });

    it('should clear all filters', () => {
      component.searchTerm = 'test';
      component.selectedMatieres = ['math'];
      component.sortBy = 'prenom_desc';
      component.pageIndex = 1;

      component.clearFilters();

      expect(component.searchTerm).toBe('');
      expect(component.selectedMatieres).toEqual([]);
      expect(component.sortBy).toBe('nom_asc');
      expect(component.pageIndex).toBe(0);
      expect(mockEtudiantsService.getStudentList).toHaveBeenCalled();
    });

    it('should handle matieres filter change', () => {
      component.onMatieresFilterChange();

      expect(component.pageIndex).toBe(0);
      expect(mockEtudiantsService.getStudentList).toHaveBeenCalled();
    });

    it('should handle sort change', () => {
      component.onFilterChange();

      expect(mockEtudiantsService.getStudentList).toHaveBeenCalled();
    });
  });

  describe('Computed Properties', () => {
    it('should return paged students', () => {
      component.EtudiantsListe = mockStudents;
      expect(component.pagedEtudiants).toEqual(mockStudents);
    });

    it('should calculate total pages', () => {
      component.totalCount = 25;
      component.pageSize = 10;
      expect(component.totalPages).toBe(3);
    });

    it('should return visible pages', () => {
      component.totalCount = 100;
      component.pageSize = 10;
      component.pageIndex = 5;

      const visiblePages = component.getVisiblePages();
      expect(visiblePages.length).toBeGreaterThan(0);
    });

    it('should track by id', () => {
      const student = mockStudents[0];
      expect(component.trackById(0, student)).toBe(1);
    });
  });

  describe('Utility Methods', () => {
    it('should get photo URL for student with photo', () => {
      const student = { id: 1, nom: 'Doe', prenom: 'John', mail: 'john@test.com', photo: '/uploads/test.jpg', matieres: [] };
      const url = component.getPhotoUrl('/uploads/test.jpg', student as Etudiants);
      expect(url).toContain('http://localhost:3000');
    });

    it('should get avatar URL for student without photo', () => {
      const student = { id: 1, nom: 'Doe', prenom: 'John' };
      const url = component.getPhotoUrl(null, student as Etudiants);
      expect(url).toContain('ui-avatars.com');
    });

    it('should check if value is number', () => {
      expect(component.isNumber(5)).toBeTrue();
      expect(component.isNumber('5')).toBeFalse();
    });

    it('should get sort direction', () => {
      component.sortBy = 'nom_asc';
      expect(component.getSortDirection('nom')).toBe('asc');
      expect(component.getSortDirection('prenom')).toBeNull();
    });
  });

  describe('Delete Functionality', () => {
    const studentToDelete = mockStudents[0];

    beforeEach(() => {
      mockEtudiantsService.deleteStudent.and.returnValue(of(void 0));
    });

    it('should open delete confirmation', () => {
      component.openDeleteConfirm(studentToDelete);

      expect(component.studentToDelete).toBe(studentToDelete);
      expect(component.showDeleteConfirm).toBeTrue();
    });

    it('should confirm and delete student', () => {
      component.studentToDelete = studentToDelete;
      component.confirmDeleteStudent();

      expect(mockEtudiantsService.deleteStudent).toHaveBeenCalledWith(1);
      expect(mockToastService.success).toHaveBeenCalledWith('Étudiant supprimé avec succès');
      expect(component.showDeleteConfirm).toBeFalse();
      expect(component.studentToDelete).toBeNull();
    });

    it('should handle delete error', () => {
      mockEtudiantsService.deleteStudent.and.returnValue(throwError(() => new Error('Delete failed')));

      component.studentToDelete = studentToDelete;
      component.confirmDeleteStudent();

      expect(mockToastService.error).toHaveBeenCalled();
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      // Mock fetch for export methods
      spyOn(window, 'fetch').and.returnValue(Promise.resolve(new Response()));
      spyOn(document, 'createElement').and.returnValue({
        click: jasmine.createSpy(),
        href: '',
        download: ''
      } as any);
      spyOn(document.body, 'appendChild');
      spyOn(document.body, 'removeChild');
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(URL, 'revokeObjectURL');
    });

    it('should export selected students', async () => {
      component.selectedStudents = [mockStudents[0]];

      await component.exportSelectedStudents();

      expect(window.fetch).toHaveBeenCalled();
      expect(mockToastService.success).toHaveBeenCalledWith('Export des étudiants sélectionnés terminé.');
    });

    it('should show info when no students selected', () => {
      component.selectedStudents = [];

      component.exportSelectedStudents();

      expect(mockToastService.info).toHaveBeenCalledWith('Veuillez sélectionner au moins un étudiant à exporter.');
    });

    it('should export students template', async () => {
      await component.exportStudentsTemplate();

      expect(window.fetch).toHaveBeenCalled();
      expect(mockToastService.info).toHaveBeenCalledWith('Téléchargement du template CSV...');
    });
  });

  describe('Demo Mode', () => {
    it('should detect demo mode from URL', () => {
      Object.defineProperty(mockRouter, 'url', { value: '/demo/etudiants' });
      component.ngOnInit();

      expect(component.isDemoMode).toBeTrue();
    });

    it('should load demo students when in demo mode', () => {
      component.isDemoMode = true;
      (component as any).loadStudents();

      expect(mockEtudiantsService.getStudentList).toHaveBeenCalledWith(1, 100, undefined, undefined, undefined, { isDemo: true });
    });
  });

  describe('Error Handling', () => {
    it('should handle load students error', () => {
      mockEtudiantsService.getStudentList.and.returnValue(throwError(() => new Error('Load failed')));

      (component as any).loadStudents();

      expect(component.error).toBe('Impossible de charger la liste des étudiants.');
      expect(component.loading).toBeFalse();
      expect(mockToastService.error).toHaveBeenCalledWith('Erreur lors du chargement des étudiants');
    });

    it('should handle image load error', () => {
      const event = { target: { style: { display: '' } } };
      component.handleImageError(event as any, mockStudents[0] as Etudiants);

      expect(event.target.style.display).toBe('none');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});
