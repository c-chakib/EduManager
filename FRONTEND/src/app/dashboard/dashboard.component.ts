import { Component, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { LoggerService } from '../core/services/logger.service';
import { SocketService } from '../services/socket.service';
import { ActivatedRoute } from '@angular/router';
import { Subscription, debounceTime } from 'rxjs';

// Interface definitions for better type safety
interface Student {
  _id?: string;
  nom: string;
  prenom: string;
  niveau?: string;
  filiere?: string;
  genre?: string;
  dateNaissance?: string;
  boursier?: boolean;
  notes?: Note[];
}

interface Note {
  matiere: string;
  note: number;
  coefficient?: number;
}

interface DashboardData {
  totalStudents: number;
  averageAge: number;
  levelStats: { [key: string]: number };
  specializationStats: { [key: string]: number };
  genderStats: { [key: string]: number };
  subjectStats: { [key: string]: any };
  averageGrades: { [key: string]: string };
  scholarshipStats: { [key: string]: number };
  topStudents: any[];
  error?: string;
}

interface ChartData {
  label: string;
  value: number;
  percentage: number;
  average?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Statistics data with proper typing
  totalStudents: number = 0;
  averageAge: number = 0;
  levelStats: { [key: string]: number } = {};
  specializationStats: { [key: string]: number } = {};
  genderStats: { [key: string]: number } = {};
  subjectStats: { [key: string]: any } = {};
  scholarshipStats: { [key: string]: number } = { 'Avec Bourse': 0, 'Sans Bourse': 0 };
  averageGrades: { [key: string]: string } = {};
  topStudents: any[] = [];
  
  // UI state
  isLoading: boolean = true;
  errorMessage: string = '';
  
  // Chart data with proper typing
  chartDataLevels: ChartData[] = [];
  chartDataSpecializations: ChartData[] = [];
  chartDataGender: ChartData[] = [];
  chartDataSubjects: ChartData[] = [];
  chartDataScholarships: ChartData[] = [];
  
  private refreshSubscription?: Subscription;
  private readonly CHART_COLORS = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', 
    '#1abc9c', '#e67e22', '#16a085', '#c0392b', '#8e44ad'
  ];

  constructor(
    private route: ActivatedRoute,
    private logger: LoggerService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.initializeDashboard();
    this.setupRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  private initializeDashboard(): void {
    const resolvedData = this.route.snapshot.data['dashboardData'] as DashboardData;
    
    if (resolvedData && !resolvedData.error) {
      this.updateDashboardData(resolvedData);
    } else {
      this.handleError(resolvedData?.error || 'Erreur lors du chargement du dashboard.');
    }
  }

  private updateDashboardData(data: DashboardData): void {
    try {
      this.totalStudents = data.totalStudents;
      this.averageAge = data.averageAge;
      this.levelStats = data.levelStats || {};
      this.specializationStats = data.specializationStats || {};
      this.genderStats = data.genderStats || {};
      this.subjectStats = data.subjectStats || {};
      this.averageGrades = data.averageGrades || {};
      this.scholarshipStats = data.scholarshipStats || { 'Avec Bourse': 0, 'Sans Bourse': 0 };
      this.topStudents = data.topStudents || [];
      this.prepareChartData();
      this.isLoading = false;
      this.errorMessage = '';
      this.logger.info('Dashboard data loaded successfully', { 
        totalStudents: this.totalStudents,
        chartsGenerated: this.getChartsCount()
      });
    } catch (error) {
      this.handleError('Erreur lors du traitement des données du dashboard.');
    }
  }

  private setupRealTimeUpdates(): void {
    this.refreshSubscription = new Subscription();
    
    // Debounce rapid successive events (e.g., multiple updates at once)
    const studentEvents = this.socketService.onStudentCreated()
      .pipe(debounceTime(300));
    
    this.refreshSubscription.add(
      studentEvents.subscribe(() => this.handleDataUpdate('Student created'))
    );
    
    this.refreshSubscription.add(
      this.socketService.onStudentUpdated()
        .pipe(debounceTime(300))
        .subscribe(() => this.handleDataUpdate('Student updated'))
    );
    
    this.refreshSubscription.add(
      this.socketService.onStudentDeleted()
        .pipe(debounceTime(300))
        .subscribe(() => this.handleDataUpdate('Student deleted'))
    );
  }

  private handleDataUpdate(event: string): void {
    this.logger.info('Dashboard update triggered', { event });
    // In a real app, you might want to:
    // 1. Show a subtle notification
    // 2. Optionally refresh specific data instead of full reload
    // 3. Use optimistic updates where possible
    this.reloadStatistics();
  }

  reloadStatistics(): void {
    this.isLoading = true;
    // This would typically call a service to refresh data
    // For now, we'll simulate a brief loading state
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  private prepareChartData(): void {
    this.chartDataLevels = this.prepareChartDataFromStats(this.levelStats);
    this.chartDataSpecializations = this.prepareChartDataFromStats(this.specializationStats);
    this.chartDataGender = this.prepareChartDataFromStats(this.genderStats);
    this.chartDataScholarships = this.prepareChartDataFromStats(this.scholarshipStats);
    this.chartDataSubjects = this.prepareSubjectChartData();
  }

  private prepareChartDataFromStats(stats: { [key: string]: number }): ChartData[] {
    return Object.entries(stats)
      .map(([label, value]) => ({
        label,
        value,
        percentage: this.totalStudents > 0 ? Math.round((value / this.totalStudents) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value);
  }

  private prepareSubjectChartData(): ChartData[] {
    return Object.entries(this.subjectStats)
      .map(([label, value]: [string, any]) => ({
        label,
        value: value.count || 0,
        average: this.averageGrades[label] ? this.averageGrades[label] : 'N/A',
        percentage: this.totalStudents > 0 ? Math.round((value.count / this.totalStudents) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  private handleError(message: string): void {
    this.isLoading = false;
    this.errorMessage = message;
    this.logger.error('Dashboard error', { message });
  }

  // Public methods for template
  getProgressColor(index: number): string {
    return this.CHART_COLORS[index % this.CHART_COLORS.length];
  }

  getLevelsCount(): number {
    return Object.keys(this.levelStats).length;
  }

  getSpecializationsCount(): number {
    return Object.keys(this.specializationStats).length;
  }

  getSubjectsCount(): number {
    return Object.keys(this.subjectStats).length;
  }

  getScholarshipPercentage(): number {
    if (this.totalStudents === 0) return 0;
    return Math.round((this.scholarshipStats['Avec Bourse'] / this.totalStudents) * 100);
  }

  getOverallAverage(): string {
    const subjects = Object.keys(this.averageGrades);
    if (subjects.length === 0) return '0.00';
    const total = subjects.reduce((sum, subject) => {
      const val = parseFloat(this.averageGrades[subject]);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
    return (total / subjects.length).toFixed(2);
  }

  // Utility method for logging/debugging
  private getChartsCount(): number {
    return [
      this.chartDataLevels,
      this.chartDataSpecializations,
      this.chartDataGender,
      this.chartDataSubjects,
      this.chartDataScholarships
    ].reduce((total, chart) => total + chart.length, 0);
  }

  // Method to handle retry from template
  loadStatistics(): void {
    this.isLoading = true;
    this.errorMessage = '';
    // Simulate reload - in real app, this would call your service
    setTimeout(() => {
      this.initializeDashboard();
    }, 1000);
  }
}