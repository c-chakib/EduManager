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

  // preview
  previewUrl = '';
  photoInvalid = false;

  // Matières prédéfinies
  allMatieres: string[] = [];
  isDropdownOpen: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private etudiantsService: EtudiantsServiceService,
    private toastService: ToastService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    // Charger d'abord les matières prédéfinies
    this.loadMatieres();
    
    // Détecter le mode (création/modification)
    this.etudiantId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.etudiantId;
    
    if (this.isEditMode) {
      this.loadEtudiantForEdit(this.etudiantId!);
    } else {
      // Mode création : initialiser un étudiant vide
      this.initializeNewStudent();
    }
  }

  // Charger les matières prédéfinies depuis le backend
  loadMatieres(): void {
    this.etudiantsService.getAllMatieres().subscribe({
      next: (matieres: string[]) => {
        this.allMatieres = matieres;
      },
      error: (error: any) => {
        this.logger.error('Erreur lors du chargement des matières:', error);
      }
    });
  }

  // Initialiser un nouvel étudiant pour la création
  initializeNewStudent(): void {
    this.etudiant = {
      // Informations de base (REQUIRED)
      nom: '',
      prenom: '',
      mail: '',
      photo: '',
      matieres: [],
      
      // Informations personnelles
      dateNaissance: undefined,
      lieuNaissance: '',
      genre: undefined,
      nationalite: 'Française',
      
      // Contact
      telephone: '',
      telephoneParent: '',
      adresse: '',
      ville: '',
      codePostal: '',
      pays: 'France',
      
      // Informations académiques
      numeroEtudiant: '',
      niveau: '',
      filiere: '',
      anneeInscription: new Date().getFullYear(),
      statut: 'actif',
      
      // Informations complémentaires
      boursier: false,
      redoublant: false,
      remarques: '',
      
      // Notes et documents (initialisés vides)
      notes: [],
      documents: []
    };
    this.previewUrl = '';
    this.photoInvalid = false;
  }

  // Charger les données de l'étudiant pour modification
  loadEtudiantForEdit(id: string): void {
    this.loading = true;
    this.etudiantsService.getStudentById(Number(id)).subscribe({
      next: (etudiant: Etudiants) => {
        this.etudiant = { ...etudiant };
        // Le select multiple se synchronisera automatiquement avec etudiant.matieres
        
        // Afficher la photo si elle existe
        if (etudiant.photo && etudiant.photo !== 'Picture unavailable') {
          this.previewUrl = etudiant.photo;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.logger.error('Erreur lors du chargement de l\'étudiant:', error);
        this.error = 'Erreur lors du chargement des données de l\'étudiant.';
        this.loading = false;
      }
    });
  }

  // Gestion des matières avec interface de tags
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

  // Vérifier si une matière est sélectionnée
  isMatiereSelected(matiere: string): boolean {
    return this.etudiant.matieres?.includes(matiere) || false;
  }

  // Gestion du dropdown
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  // Fermer le dropdown en cliquant à l'extérieur
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const dropdown = target.closest('.dropdown-container');
    if (!dropdown && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  // --- Photo preview
  onPhotoBlur() {
    const url = (this.etudiant.photo || '').trim();
    if (!url) {
      this.previewUrl = '';
      this.photoInvalid = false;
      return;
    }
    const valid = /^https?:\/\/.+/i.test(url);
    this.photoInvalid = !valid;
    this.previewUrl = valid ? url : '';
  }
  onPreviewError() {
    this.previewUrl = '';
    this.photoInvalid = true;
  }

  // --- Matières methods
  removeMatiere(index: number) {
    if (this.etudiant.matieres) {
      this.etudiant.matieres.splice(index, 1);
    }
  }

  // --- Submit
  onSubmit(form: NgForm) {
    if (form.invalid) {
      this.error = 'Veuillez corriger les erreurs du formulaire.';
      return;
    }
    this.error = '';
    this.loading = true;

    const etudiantData = {
      nom: this.etudiant.nom!.trim(),
      prenom: this.etudiant.prenom!.trim(),
      mail: this.etudiant.mail!.trim(),
      photo: (this.etudiant.photo || '').trim() || 'Picture unavailable',
      matieres: this.etudiant.matieres ?? []
    };

    if (this.isEditMode && this.etudiantId) {
      // Mode modification
      this.etudiantsService.updateStudent(Number(this.etudiantId), etudiantData).subscribe({
        next: (response) => {
          this.loading = false;
          this.toastService.success('Étudiant modifié avec succès !', 'Modification réussie');
          this.router.navigate(['/etudiants']);
        },
        error: (err) => {
          this.logger.error('Error updating student:', err);
          this.loading = false;
          
          if (err.error && err.error.message) {
            this.error = err.error.message;
          } else if (err.message) {
            this.error = err.message;
          } else {
            this.error = 'Erreur lors de la modification de l\'étudiant.';
          }
          this.toastService.error(this.error, 'Erreur');
        }
      });
    } else {
      // Mode création
      this.etudiantsService.createStudent(etudiantData).subscribe({
        next: (response) => {
          this.loading = false;
          this.toastService.success('Étudiant créé avec succès !', 'Création réussie');
          this.router.navigate(['/etudiants']);
        },
        error: (err) => {
          this.logger.error('Error creating student:', err);
          this.loading = false;
          
          if (err.error && err.error.message) {
            this.error = err.error.message;
          } else if (err.message) {
            this.error = err.message;
          } else {
            this.error = 'Erreur lors de la création de l\'étudiant.';
          }
          this.toastService.error(this.error, 'Erreur');
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/etudiants']);
  }
}
