import { Component, OnInit, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import { EtudiantsServiceService } from '../etudiants-service.service';
import { Etudiants } from '../etudiants';
import { ToastService } from '../../shared/services/toast.service';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-etudiant-form',
  standalone: false,
  templateUrl: './etudiant-form.component.html',
  styleUrls: ['./etudiant-form.component.css']
})
export class EtudiantFormComponent implements OnInit {
  loading = false;
  error = '';
  isEditMode = false;
  etudiantId: string | null = null;

  etudiant: Partial<Etudiants> = {
    nom: '',
    prenom: '',
    mail: '',
    photo: '',
    matieres: []
  };

  // File upload
  selectedFile: File | null = null;
  filePreviewUrl = '';

  // Matières management
  allMatieres: string[] = [];
  filteredMatieres: string[] = [];
  matiereSearchTerm: string = '';
  isDropdownOpen = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private etudiantsService: EtudiantsServiceService,
    private toastService: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadMatieres();
    
    this.etudiantId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.etudiantId;
    
    if (this.isEditMode) {
      this.loadEtudiantForEdit(this.etudiantId!);
    } else {
      this.initializeNewStudent();
    }
  }

  loadMatieres(): void {
    this.etudiantsService.getAllMatieres().subscribe({
      next: (matieres: string[]) => {
        this.allMatieres = matieres;
        this.filteredMatieres = [...matieres];
      },
      error: (error: any) => {
        this.logger.error('Erreur lors du chargement des matières:', error);
        // Fallback matières
        this.allMatieres = [
          'Mathématiques',
          'Physique',
          'Chimie',
          'Informatique',
          'Français',
          'Anglais',
          'Histoire',
          'Géographie'
        ];
        this.filteredMatieres = [...this.allMatieres];
      }
    });
  }

  initializeNewStudent(): void {
    this.etudiant = {
      nom: '',
      prenom: '',
      mail: '',
      photo: '',
      matieres: [],
      dateNaissance: undefined,
      lieuNaissance: '',
      genre: undefined,
      nationalite: 'Française',
      telephone: '',
      telephoneParent: '',
      adresse: '',
      ville: '',
      codePostal: '',
      pays: 'France',
      numeroEtudiant: '',
      niveau: '',
      filiere: '',
      anneeInscription: new Date().getFullYear(),
      statut: 'actif',
      boursier: false,
      redoublant: false,
      remarques: '',
      notes: [],
      documents: []
    };
  }

  loadEtudiantForEdit(id: string): void {
    this.loading = true;
    this.etudiantsService.getStudentById(Number(id)).subscribe({
      next: (etudiant: Etudiants) => {
        // FIX: Create a deep copy to avoid reference issues
        this.etudiant = { ...etudiant };
        // Handle matieres: if it's a string (JSON), parse it to array
        if (typeof this.etudiant.matieres === 'string') {
          try {
            this.etudiant.matieres = JSON.parse(this.etudiant.matieres);
          } catch (error) {
            console.error('Error parsing matieres:', error);
            this.etudiant.matieres = [];
          }
        } else if (!Array.isArray(this.etudiant.matieres)) {
          this.etudiant.matieres = [];
        }
        // Ensure it's an array and create a copy
        if (Array.isArray(this.etudiant.matieres)) {
          this.etudiant.matieres = [...this.etudiant.matieres];
        } else {
          this.etudiant.matieres = [];
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.logger.error('Erreur lors du chargement de l\'étudiant:', error);
        this.error = 'Erreur lors du chargement des données de l\'étudiant.';
        this.loading = false;
        this.toastService.error(this.error, 'Erreur');
      }
    });
  }

  // Matières management
  toggleMatiere(matiere: string): void {
    if (!this.etudiant.matieres) {
      this.etudiant.matieres = [];
    }
    
    const index = this.etudiant.matieres.indexOf(matiere);
    if (index > -1) {
      this.etudiant.matieres.splice(index, 1);
    } else {
      this.etudiant.matieres.push(matiere);
    }
  }

  isMatiereSelected(matiere: string): boolean {
    return this.etudiant.matieres?.includes(matiere) || false;
  }

  removeMatiere(index: number): void {
    if (this.etudiant.matieres) {
      this.etudiant.matieres.splice(index, 1);
    }
  }

  // Dropdown management
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    if (this.isDropdownOpen) {
      // Reset search when opening
      this.matiereSearchTerm = '';
      this.filterMatieres();
      // Focus search input after a short delay
      setTimeout(() => {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
    this.matiereSearchTerm = '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.multi-select-container');
    if (!dropdown && this.isDropdownOpen) {
      this.closeDropdown();
    }
  }

  // Search and filter methods
  filterMatieres(): void {
    if (!this.matiereSearchTerm.trim()) {
      this.filteredMatieres = [...this.allMatieres];
    } else {
      const searchTerm = this.matiereSearchTerm.toLowerCase();
      this.filteredMatieres = this.allMatieres.filter(matiere =>
        matiere.toLowerCase().includes(searchTerm)
      );
    }
  }

  clearSearch(): void {
    this.matiereSearchTerm = '';
    this.filterMatieres();
    // Refocus search input
    setTimeout(() => {
      const searchInput = document.querySelector('.search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, 0);
  }

  selectAllMatieres(): void {
    if (!this.etudiant.matieres) {
      this.etudiant.matieres = [];
    }
    // Add all filtered matieres that aren't already selected
    this.filteredMatieres.forEach(matiere => {
      if (!this.etudiant.matieres!.includes(matiere)) {
        this.etudiant.matieres!.push(matiere);
      }
    });
  }

  clearAllMatieres(): void {
    this.etudiant.matieres = [];
  }

  // File handling
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.filePreviewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('photo') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  onPreviewError(): void {
    this.filePreviewUrl = '';
    if (this.etudiant.photo) {
      this.etudiant.photo = '';
    }
  }

  // Form submission - FIXED VERSION
  onSubmit(form: NgForm): void {
    // Mark all fields as touched to trigger validation messages
    Object.keys(form.controls).forEach(key => {
      form.controls[key].markAsTouched();
    });

    if (form.invalid) {
      this.error = 'Veuillez corriger les erreurs du formulaire.';
      this.scrollToFirstError();
      return;
    }

    this.error = '';
    this.loading = true;

    const formData = new FormData();
    
    // Required fields
    formData.append('nom', this.etudiant.nom!.trim());
    formData.append('prenom', this.etudiant.prenom!.trim());
    formData.append('mail', this.etudiant.mail!.trim());
    
    // Optional fields - only append if they have values
    if (this.etudiant.matieres && this.etudiant.matieres.length > 0) {
      formData.append('matieres', JSON.stringify(this.etudiant.matieres));
    }
    
    if (this.etudiant.dateNaissance) {
      formData.append('dateNaissance', this.etudiant.dateNaissance.toString());
    }
    
    if (this.etudiant.lieuNaissance) {
      formData.append('lieuNaissance', this.etudiant.lieuNaissance);
    }
    
    if (this.etudiant.genre) {
      formData.append('genre', this.etudiant.genre);
    }
    
    if (this.etudiant.nationalite) {
      formData.append('nationalite', this.etudiant.nationalite);
    }
    
    if (this.etudiant.telephone) {
      formData.append('telephone', this.etudiant.telephone);
    }
    
    if (this.etudiant.telephoneParent) {
      formData.append('telephoneParent', this.etudiant.telephoneParent);
    }
    
    if (this.etudiant.adresse) {
      formData.append('adresse', this.etudiant.adresse);
    }
    
    if (this.etudiant.ville) {
      formData.append('ville', this.etudiant.ville);
    }
    
    if (this.etudiant.codePostal) {
      formData.append('codePostal', this.etudiant.codePostal);
    }
    
    if (this.etudiant.pays) {
      formData.append('pays', this.etudiant.pays);
    }
    
    if (this.etudiant.numeroEtudiant) {
      formData.append('numeroEtudiant', this.etudiant.numeroEtudiant);
    }
    
    if (this.etudiant.niveau) {
      formData.append('niveau', this.etudiant.niveau);
    }
    
    if (this.etudiant.filiere) {
      formData.append('filiere', this.etudiant.filiere);
    }
    
    if (this.etudiant.anneeInscription) {
      formData.append('anneeInscription', this.etudiant.anneeInscription.toString());
    }
    
    if (this.etudiant.statut) {
      formData.append('statut', this.etudiant.statut);
    }
    
    formData.append('boursier', this.etudiant.boursier?.toString() || 'false');
    formData.append('redoublant', this.etudiant.redoublant?.toString() || 'false');
    
    if (this.etudiant.remarques) {
      formData.append('remarques', this.etudiant.remarques);
    }

    // FIX: Proper photo handling - only upload new photo if selected
    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    } else if (this.isEditMode && this.etudiant.photo) {
      // Keep existing photo if no new file is selected
      formData.append('existingPhoto', this.etudiant.photo);
    }

    if (this.isEditMode && this.etudiantId) {
      // Mode modification
      this.etudiantsService.updateStudent(Number(this.etudiantId), formData).subscribe({
        next: (response) => {
          this.loading = false;
          this.toastService.success('Étudiant modifié avec succès !', 'Modification réussie');
          // FIX: Force reload of students list
          this.etudiantsService.notifyStudentsChanged();
          this.router.navigate(['/etudiants']);
        },
        error: (err) => {
          this.handleError(err, 'modification');
        }
      });
    } else {
      // Mode création
      this.etudiantsService.createStudent(formData).subscribe({
        next: (response) => {
          this.loading = false;
          this.toastService.success('Étudiant créé avec succès !', 'Création réussie');
          // FIX: Force reload of students list
          this.etudiantsService.notifyStudentsChanged();
          this.router.navigate(['/etudiants']);
        },
        error: (err) => {
          this.handleError(err, 'création');
        }
      });
    }
  }

  private handleError(err: any, operation: string): void {
    this.logger.error(`Error ${operation} student:`, err);
    this.loading = false;
    
    if (err.error && err.error.message) {
      this.error = err.error.message;
    } else if (err.message) {
      this.error = err.message;
    } else {
      this.error = `Erreur lors de la ${operation} de l'étudiant.`;
    }
    
    this.toastService.error(this.error, 'Erreur');
    this.scrollToTop();
  }

  private scrollToFirstError(): void {
    const firstInvalidControl = document.querySelector('.form-control.invalid');
    if (firstInvalidControl) {
      firstInvalidControl.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    } else {
      this.scrollToTop();
    }
  }

  private scrollToTop(): void {
    window.scrollTo({ 
      top: 0, 
      behavior: 'smooth' 
    });
  }

  goBack(): void {
    this.router.navigate(['/etudiants']);
  }
}