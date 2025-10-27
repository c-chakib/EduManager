import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { EtudiantsServiceService } from '../etudiants/etudiants-service.service';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DashboardResolver implements Resolve<any> {
  constructor(private etudiantService: EtudiantsServiceService) {}
  resolve(): Observable<any> {
    return this.etudiantService.getStudentList(1, 1000).pipe(
      map(resp => {
        const students = resp.data.filter((s: any) => !s.isDemo);
        // Calculate statistics (same as DashboardComponent)
        const totalStudents = students.length;
        let averageAge = 0;
        if (totalStudents > 0) {
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
          averageAge = Math.round(totalAge / totalStudents);
        }
        const levelStats = students.reduce((acc: { [key: string]: number }, student) => {
          const level = student.niveau || 'Non spécifié';
          acc[level] = (acc[level] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
        const specializationStats = students.reduce((acc: { [key: string]: number }, student) => {
          const spec = student.filiere || 'Non spécifié';
          acc[spec] = (acc[spec] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
        const genderStats = students.reduce((acc: { [key: string]: number }, student) => {
          let gender = 'Non spécifié';
          if (student.genre === 'M') gender = 'Masculin';
          else if (student.genre === 'F') gender = 'Féminin';
          else if (student.genre) gender = student.genre;
          acc[gender] = (acc[gender] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });
        // Subject stats
        const subjectStats: any = {};
        students.forEach(student => {
          if (student.notes && Array.isArray(student.notes)) {
            student.notes.forEach((note: any) => {
              const subjectName = note.matiere || 'Non spécifié';
              if (!subjectStats[subjectName]) {
                subjectStats[subjectName] = {
                  count: 0,
                  totalGrades: 0,
                  students: 0
                };
              }
              subjectStats[subjectName].count++;
              if (note.note) {
                subjectStats[subjectName].totalGrades += note.note;
                subjectStats[subjectName].students++;
              }
            });
          }
        });
        // Average grades per subject
        const averageGrades: any = {};
        Object.keys(subjectStats).forEach(subject => {
          if (subjectStats[subject].students > 0) {
            averageGrades[subject] = (
              subjectStats[subject].totalGrades / subjectStats[subject].students
            ).toFixed(2);
          }
        });
        // Scholarship stats
        const scholarshipStats = students.reduce((acc, student) => {
          if (student.boursier) {
            acc['Avec Bourse'] = (acc['Avec Bourse'] || 0) + 1;
          } else {
            acc['Sans Bourse'] = (acc['Sans Bourse'] || 0) + 1;
          }
          return acc;
        }, { 'Avec Bourse': 0, 'Sans Bourse': 0 });
        // Top students
        const topStudents = students
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
        return {
          totalStudents,
          averageAge,
          levelStats,
          specializationStats,
          genderStats,
          subjectStats,
          averageGrades,
          scholarshipStats,
          topStudents
        };
      }),
      catchError(error => of({ error: 'Erreur lors du chargement du dashboard', details: error }))
    );
  }
}
