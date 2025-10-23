import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoggerService } from '../core/services/logger.service';
import { EtudiantsServiceService } from '../etudiants/etudiants-service.service';
import { SocketService } from '../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Statistics data
  totalStudents: number = 0;
  averageAge: number = 0;
  levelStats: any = {};
  specializationStats: any = {};
  genderStats: any = {};
  subjectStats: any = {};
  scholarshipStats: any = { 'Avec Bourse': 0, 'Sans Bourse': 0 };
  // Advanced statistics
  averageGrades: any = {};
  topStudents: any[] = [];
  isLoading: boolean = true;
  errorMessage: string = '';
  // Chart data
  chartDataLevels: any[] = [];
  chartDataSpecializations: any[] = [];
  chartDataGender: any[] = [];
  chartDataSubjects: any[] = [];
  chartDataScholarships: any[] = [];
  private refreshSubscription?: Subscription;
  constructor(
    private etudiantService: EtudiantsServiceService,
    private logger: LoggerService,
    private socketService: SocketService
  ) {}
  ngOnInit(): void {
    // Initial load
    this.loadStatistics();

    // Listen for real-time student events from Socket.io
    this.refreshSubscription = new Subscription();
    this.refreshSubscription.add(this.socketService.onStudentCreated().subscribe(() => this.loadStatistics()));
    this.refreshSubscription.add(this.socketService.onStudentUpdated().subscribe(() => this.loadStatistics()));
    this.refreshSubscription.add(this.socketService.onStudentDeleted().subscribe(() => this.loadStatistics()));
  }
  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }
  loadStatistics(): void {
    this.isLoading = true;
    this.errorMessage = '';
    // Load all students (excluding demo students)
    this.etudiantService.getStudentList(1, 1000).subscribe({
      next: (resp: any) => {
        // Filter out demo students
        const realStudents = resp.data.filter((s: any) => !s.isDemo);
        this.calculateStatistics(realStudents);
        this.prepareChartData();
        this.isLoading = false;
      },
      error: (error: any) => {
        this.logger.error('Erreur lors du chargement du dashboard:', error);
        this.errorMessage = 'Erreur lors du chargement du dashboard. Veuillez réessayer.';
        this.isLoading = false;
      }
    });
  }
  private calculateStatistics(students: any[]): void {
    this.totalStudents = students.length;
    if (this.totalStudents === 0) return;
    // Calculate average age using dateNaissance
    const totalAge = students.reduce((sum, student) => {
      if (!student.dateNaissance) return sum;
      const birthDate = new Date(student.dateNaissance);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return sum + age;
    }, 0);
    this.averageAge = Math.round(totalAge / this.totalStudents);
    // Calculate level statistics
    this.levelStats = students.reduce((acc, student) => {
      const level = student.niveau || 'Non spécifié';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
    // Calculate filiere statistics (was specialite)
    this.specializationStats = students.reduce((acc, student) => {
      const spec = student.filiere || 'Non spécifié';
      acc[spec] = (acc[spec] || 0) + 1;
      return acc;
    }, {});
    // Calculate gender statistics (using genre field)
    this.genderStats = students.reduce((acc, student) => {
      let gender = 'Non spécifié';
      if (student.genre === 'M') gender = 'Masculin';
      else if (student.genre === 'F') gender = 'Féminin';
      else if (student.genre) gender = student.genre;
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});
    // Calculate subject statistics from notes array
    this.subjectStats = {};
    students.forEach(student => {
      if (student.notes && Array.isArray(student.notes)) {
        student.notes.forEach((note: any) => {
          const subjectName = note.matiere || 'Non spécifié';
          if (!this.subjectStats[subjectName]) {
            this.subjectStats[subjectName] = {
              count: 0,
              totalGrades: 0,
              students: 0
            };
          }
          this.subjectStats[subjectName].count++;
          if (note.note) {
            this.subjectStats[subjectName].totalGrades += note.note;
            this.subjectStats[subjectName].students++;
          }
        });
      }
    });
    // Calculate average grades per subject
    this.averageGrades = {};
    Object.keys(this.subjectStats).forEach(subject => {
      if (this.subjectStats[subject].students > 0) {
        this.averageGrades[subject] = (
          this.subjectStats[subject].totalGrades / this.subjectStats[subject].students
        ).toFixed(2);
      }
    });
    // Calculate scholarship statistics (using boursier field)
    this.scholarshipStats = students.reduce((acc, student) => {
      if (student.boursier) {
        acc['Avec Bourse'] = (acc['Avec Bourse'] || 0) + 1;
      } else {
        acc['Sans Bourse'] = (acc['Sans Bourse'] || 0) + 1;
      }
      return acc;
    }, { 'Avec Bourse': 0, 'Sans Bourse': 0 });
    // Calculate top students by average grade from notes
    this.topStudents = students
      .map(student => {
        if (!student.notes || !Array.isArray(student.notes) || student.notes.length === 0) {
          return null;
        }
        const validGrades = student.notes.filter((n: any) => n.note != null);
        if (validGrades.length === 0) return null;
        const totalGrade = validGrades.reduce((sum: number, n: any) => sum + (n.note * (n.coefficient || 1)), 0);
        const totalCoef = validGrades.reduce((sum: number, n: any) => sum + (n.coefficient || 1), 0);
        const average = totalGrade / totalCoef;
        return {
          nom: student.nom,
          prenom: student.prenom,
          niveau: student.niveau,
          specialite: student.filiere,
          moyenne: average.toFixed(2)
        };
      })
      .filter(s => s !== null)
      .sort((a: any, b: any) => b.moyenne - a.moyenne)
      .slice(0, 10);
  }
  private prepareChartData(): void {
    // Prepare level chart data
    this.chartDataLevels = Object.entries(this.levelStats).map(([key, value]) => ({
      label: key,
      value: value,
      percentage: Math.round((value as number / this.totalStudents) * 100)
    }));
    // Prepare specialization chart data
    this.chartDataSpecializations = Object.entries(this.specializationStats).map(([key, value]) => ({
      label: key,
      value: value,
      percentage: Math.round((value as number / this.totalStudents) * 100)
    }));
    // Prepare gender chart data
    this.chartDataGender = Object.entries(this.genderStats).map(([key, value]) => ({
      label: key,
      value: value,
      percentage: Math.round((value as number / this.totalStudents) * 100)
    }));
    // Prepare subject chart data (top 10 most common subjects)
    this.chartDataSubjects = Object.entries(this.subjectStats)
      .map(([key, value]: [string, any]) => ({
        label: key,
        value: value.count,
        average: this.averageGrades[key] || 'N/A',
        percentage: Math.round((value.count / this.totalStudents) * 100)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    // Prepare scholarship chart data
    this.chartDataScholarships = Object.entries(this.scholarshipStats).map(([key, value]) => ({
      label: key,
      value: value,
      percentage: Math.round((value as number / this.totalStudents) * 100)
    }));
  }
  getProgressColor(index: number): string {
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#16a085', '#c0392b', '#8e44ad'];
    return colors[index % colors.length];
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
      return sum + parseFloat(this.averageGrades[subject]);
    }, 0);
    return (total / subjects.length).toFixed(2);
  }
}
