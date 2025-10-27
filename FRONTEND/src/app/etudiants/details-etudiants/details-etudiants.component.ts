import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { Etudiants } from '../etudiants';
import { EtudiantsServiceService } from '../etudiants-service.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { BadgeVariant } from '../../shared/components/badge/badge.component';
import { LoggerService } from '../../core/services/logger.service';
import { StudentDetailResolverData } from '../../resolvers/student-detail.resolver';

@Component({
  selector: 'app-details-etudiants',
  standalone: false,
  templateUrl: './details-etudiants.component.html',
  styleUrls: ['./details-etudiants.component.css']
})
export class DetailsEtudiantsComponent implements OnInit {
  // Helper to parse matieres array - FIXED VERSION
  getMatieresArray(matieres: any): string[] {
    if (!matieres) return [];
    
    // If it's already a proper array, return it
    if (Array.isArray(matieres)) {
      return matieres.filter(m => m && typeof m === 'string');
    }
    
    // If it's a string, try to parse it
    if (typeof matieres === 'string') {
      try {
        // Clean the string first - remove excessive escaping
        let cleanedString = matieres;
        
        // Remove multiple levels of escaping
        while (cleanedString.startsWith('"') || cleanedString.startsWith('[') || cleanedString.includes('\\"')) {
          try {
            // Try to parse as JSON
            const parsed = JSON.parse(cleanedString);
            if (typeof parsed === 'string') {
              cleanedString = parsed;
            } else if (Array.isArray(parsed)) {
              return this.flattenAndCleanMatieres(parsed);
            } else {
              break;
            }
          } catch {
            // If parsing fails, try to clean the string manually
            cleanedString = cleanedString.replace(/^"+|"+$/g, '') // Remove surrounding quotes
                                         .replace(/\\"/g, '"')   // Replace escaped quotes
                                         .replace(/^\[|\]$/g, ''); // Remove brackets
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
            .replace(/^"+|"+$/g, '') // Remove quotes from individual items
            .replace(/^'|'$/g, '')   // Remove single quotes
          )
          .filter(item => item.length > 0);
        
        return items;
      } catch (error) {
        console.error('Error parsing matieres:', error, 'Original:', matieres);
        return [];
      }
    }
    
    return [];
  }

  // Helper method to flatten nested arrays
  private flattenAndCleanMatieres(arr: any[]): string[] {
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

  // Helper method to get proper photo URL
  getPhotoUrl(photo: string | null | undefined): string {
    if (!photo) {
      return `https://ui-avatars.com/api/?name=${this.etudiant?.prenom || 'Student'}+${this.etudiant?.nom || ''}&size=200&background=3b82f6&color=fff`;
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
  handleImageError(event: any): void {
    const img = event.target;
    img.style.display = 'none';
  }

  selectedPhotoFile: File | null = null;
  environment = environment;
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
    // Get resolved data from route
    const resolvedData = this.route.snapshot.data['studentData'] as StudentDetailResolverData;

    if (resolvedData) {
      if (resolvedData.error) {
        // Handle specific errors
        if (resolvedData.error === 'Student not found') {
          // Navigate to students list for 404 errors
          this.toastService.error('Étudiant non trouvé');
          this.router.navigate(['/etudiants']);
          return;
        }
        this.error = resolvedData.error;
        this.loading = false;
      } else if (resolvedData.data) {
        this.etudiant = { ...resolvedData.data }; // FIX: Create copy
        this.loading = false;
      } else {
        // No data and no error - fallback to manual loading
        const id = this.route.snapshot.params['id'];
        if (id) {
          this.loadEtudiantDetails(+id);
        }
      }
    } else {
      // No resolved data - fallback to manual loading
      const id = this.route.snapshot.params['id'];
      if (id) {
        this.loadEtudiantDetails(+id);
      }
    }
  }

  loadEtudiantDetails(id: number): void {
    this.loading = true;
    this.error = '';
    
    this.etudiantsService.getStudentById(id).subscribe({
      next: (etudiant) => {
        // FIX: Create a deep copy to avoid reference issues
        this.etudiant = { ...etudiant };
        if (etudiant.matieres) {
          this.etudiant.matieres = [...etudiant.matieres];
        }
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
      // Enter edit mode - create deep copy of current data
      this.editedEtudiant = { ...this.etudiant };
      if (this.etudiant.matieres) {
        this.editedEtudiant.matieres = [...this.etudiant.matieres];
      }
    }
    this.isEditing = !this.isEditing;
  }

  saveChanges(): void {
    if (!this.etudiant || !this.editedEtudiant) return;

    this.loading = true;
    
    // FIX: Create a new object with proper photo handling
    const updatedEtudiant: Etudiants = {
      ...this.etudiant,
      ...this.editedEtudiant
    };

    // If a new photo is selected, upload it first
    if (this.selectedPhotoFile) {
      const formData = new FormData();
      formData.append('photo', this.selectedPhotoFile);
      formData.append('id', String(this.etudiant.id));

      this.etudiantsService.uploadStudentPhoto(this.etudiant.id!, formData).subscribe({
        next: (photoFilename) => {
          updatedEtudiant.photo = photoFilename;
          // Update immediately for UI with proper photo URL
          if (this.etudiant) {
            this.etudiant.photo = photoFilename;
          }
          this.finalizeStudentUpdate(updatedEtudiant);
        },
        error: (err) => {
          this.logger.error('Error uploading photo:', err);
          this.loading = false;
          this.toastService.error('Erreur lors de l\'upload de la photo', 'Erreur');
        }
      });
    } else {
      this.finalizeStudentUpdate(updatedEtudiant);
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedPhotoFile = input.files[0];
      
      // Create preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.etudiant) {
          this.etudiant.photo = e.target?.result as string;
        }
      };
      reader.readAsDataURL(this.selectedPhotoFile);
    }
  }

  finalizeStudentUpdate(updatedEtudiant: Etudiants): void {
    this.etudiantsService.updateStudent(this.etudiant!.id!, updatedEtudiant).subscribe({
      next: (updatedStudent) => {
        // FIX: Create new object to trigger change detection
        this.etudiant = { ...updatedStudent };
        if (updatedStudent.matieres) {
          this.etudiant.matieres = [...updatedStudent.matieres];
        }
        
        this.isEditing = false;
        this.loading = false;
        this.selectedPhotoFile = null;
        
        // FIX: Notify list component to refresh
        this.etudiantsService.notifyStudentsChanged();
        
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
    this.selectedPhotoFile = null;
    
    // Reload original data to discard changes
    if (this.etudiant?.id) {
      this.loadEtudiantDetails(this.etudiant.id);
    }
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