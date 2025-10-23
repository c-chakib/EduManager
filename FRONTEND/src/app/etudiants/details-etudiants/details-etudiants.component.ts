import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Etudiants } from '../etudiants';
import { EtudiantsServiceService } from '../etudiants-service.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { BadgeVariant } from '../../shared/components/badge/badge.component';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-details-etudiants',
  standalone: false,
  templateUrl: './details-etudiants.component.html',
  styleUrls: ['./details-etudiants.component.css']
})
export class DetailsEtudiantsComponent implements OnInit {
  etudiant: Etudiants | null = null;
  loading: boolean = false;
  error: string = '';
  isEditing: boolean = false;
  editedEtudiant: Partial<Etudiants> = {};
  showDeleteConfirm: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private etudiantsService: EtudiantsServiceService,
    public authService: AuthService,
    private toastService: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadEtudiantDetails(+id);
    }
  }

  loadEtudiantDetails(id: number): void {
    this.loading = true;
    this.error = '';
    
    this.etudiantsService.getStudentById(id).subscribe({
      next: (etudiant) => {
        this.etudiant = etudiant;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Étudiant non trouvé';
        this.loading = false;
        this.logger.error('Error loading student details:', err);
      }
    });
  }
  toggleEditMode(): void {
    if (!this.isEditing && this.etudiant) {
      // Enter edit mode - copy current data
      this.editedEtudiant = { ...this.etudiant };
    }
    this.isEditing = !this.isEditing;
  }

  saveChanges(): void {
    if (!this.etudiant || !this.editedEtudiant) return;

    this.loading = true;
    const updatedEtudiant: Etudiants = {
      ...this.etudiant,
      ...this.editedEtudiant
    };

    this.etudiantsService.updateStudent(this.etudiant.id!, updatedEtudiant).subscribe({
      next: (updatedStudent) => {
        this.etudiant = updatedStudent;
        this.isEditing = false;
        this.loading = false;
        this.toastService.success('Étudiant mis à jour avec succès !', 'Mise à jour réussie');
      },
      error: (err) => {
          this.logger.error('Error updating student:', err);
        this.loading = false;
        this.toastService.error('Erreur lors de la mise à jour de l\'étudiant', 'Erreur');
      }
    });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editedEtudiant = {};
  }

  /**
   * Check if we're in demo mode
   */
  private isDemoMode(): boolean {
    return this.router.url.includes('/demo/');
  }

  goBack(): void {
    const basePath = this.isDemoMode() ? '/demo/etudiants' : '/etudiants';
    this.router.navigate([basePath]);
  }

  // Helper methods for labels and variants
  getStatusLabel(statut: string): string {
    const labels: Record<string, string> = {
      'actif': 'Actif',
      'inactif': 'Inactif',
      'diplome': 'Diplômé',
      'suspendu': 'Suspendu',
      'abandonne': 'Abandonné'
    };
    return labels[statut] || statut;
  }

  getStatusVariant(statut: string): BadgeVariant {
    const variants: Record<string, BadgeVariant> = {
      'actif': 'success',
      'inactif': 'secondary',
      'diplome': 'info',
      'suspendu': 'warning',
      'abandonne': 'danger'
    };
    return variants[statut] || 'secondary';
  }

  getGenreLabel(genre?: string): string {
    const labels: Record<string, string> = {
      'M': 'Masculin',
      'F': 'Féminin',
      'Autre': 'Autre'
    };
    return genre ? labels[genre] || genre : 'Non renseigné';
  }

  // Helper method to check if user can edit/delete students
  canEditStudent(): boolean {
    const role = this.authService.role;
    return role === 'admin' || role === 'super-admin';
  }
}
