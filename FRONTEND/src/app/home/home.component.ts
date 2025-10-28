import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoggerService } from '../core/services/logger.service';
import { Router } from '@angular/router';
import { EtudiantsServiceService } from '../etudiants/etudiants-service.service';
import { Etudiants } from '../etudiants/etudiants';
import { AuthService } from '../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

interface Feature {
  icon: string;
  title: string;
  description: string;
  route: string;
  color: string;
}

interface Testimonial {
  name: string;
  role: string;
  message: string;
  avatar: string;
  rating: number;
}

interface Stat {
  value: string;
  label: string;
  icon: string;
  color: string;
  trend?: string;
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  stats: Stat[] = [
    { 
      value: '1,247', 
      label: 'Étudiants Actifs', 
      icon: 'pi-users',
      color: 'text-white',
      trend: '+12% ce mois'
    },
    { 
      value: '48', 
      label: 'Matières Enseignées', 
      icon: 'pi-book',
      color: 'text-white',
      trend: '+5 nouvelles'
    },
    { 
      value: '94.5%', 
      label: 'Taux de Réussite', 
      icon: 'pi-chart-line',
      color: 'text-white',
      trend: '+3.2% cette année'
    },
    { 
      value: '4.9/5', 
      label: 'Satisfaction', 
      icon: 'pi-star-fill',
      color: 'text-white',
      trend: '1,500+ avis'
    }
  ];

  features: Feature[] = [
    {
      icon: 'pi-users',
      title: 'Gestion Étudiants Simplifiée',
      description: 'Centralisez toutes les informations de vos étudiants en un seul endroit. Ajout, modification, suppression en quelques clics.',
      route: '/etudiants',
      color: 'bg-gradient-to-br from-blue-500 to-blue-600'
    },
    {
      icon: 'pi-chart-bar',
      title: 'Analyses & Rapports',
      description: 'Tableaux de bord interactifs et rapports automatisés pour suivre les KPIs de votre établissement en temps réel.',
      route: '/etudiants',
      color: 'bg-gradient-to-br from-green-500 to-green-600'
    },
    {
      icon: 'pi-bell',
      title: 'Notifications Intelligentes',
      description: 'Alertes automatiques pour les absences, retards, échéances importantes. Restez informé sans effort.',
      route: '/etudiants',
      color: 'bg-gradient-to-br from-purple-500 to-purple-600'
    },
    {
      icon: 'pi-file-export',
      title: 'Export & Import Facile',
      description: 'Importez vos données depuis Excel/CSV. Exportez vos rapports en un clic vers PDF, Excel ou CSV.',
      route: '/etudiants',
      color: 'bg-gradient-to-br from-orange-500 to-orange-600'
    },
    {
      icon: 'pi-shield',
      title: 'Sécurité Maximale',
      description: 'Cryptage des données, authentification sécurisée, sauvegardes automatiques. Conformité RGPD garantie.',
      route: '/login',
      color: 'bg-gradient-to-br from-red-500 to-red-600'
    },
    {
      icon: 'pi-mobile',
      title: 'Multi-Plateforme',
      description: 'Application responsive accessible depuis desktop, tablette ou mobile. Travaillez partout, tout le temps.',
      route: '/etudiants',
      color: 'bg-gradient-to-br from-pink-500 to-pink-600'
    }
  ];

  testimonials: Testimonial[] = [
    {
      name: 'Marie Dubois',
      role: 'Directrice Pédagogique - Lycée Henri IV',
      message: 'EduManager a révolutionné notre gestion. Nous économisons 10 heures par semaine et les erreurs ont diminué de 95%. Un investissement qui s\'est rentabilisé en moins d\'un mois !',
      avatar: '👩‍💼',
      rating: 5
    },
    {
      name: 'Dr. Pierre Martin',
      role: 'Coordinateur - Université Paris Dauphine',
      message: 'Interface intuitive, fonctionnalités puissantes. Nos équipes administratives sont ravies. Le support client est exceptionnel et répond en moins de 2 heures.',
      avatar: '👨‍🏫',
      rating: 5
    },
    {
      name: 'Sophie Laurent',
      role: 'Chef d\'Établissement - École Centrale',
      message: 'Après avoir testé 5 solutions, EduManager se démarque par sa simplicité et sa complétude. Les rapports automatisés sont un vrai plus. Je recommande sans hésiter !',
      avatar: '👩‍🎓',
      rating: 5
    }
  ];

  constructor(
    private readonly etudiantsService: EtudiantsServiceService,
    private readonly authService: AuthService,
    public readonly router: Router,
    private readonly logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadStatistics();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStatistics(): void {
    // Check if user is authenticated
    const isAuthenticated = this.authService.isAuthenticated();
    
    if (!isAuthenticated) {
      // Show demo data for guests
      this.stats[0].value = '1,247';
      this.stats[0].label = 'Étudiants Actifs';
      this.stats[0].trend = '+12% ce mois';
      return;
    }

    // Load real data for authenticated users
      this.etudiantsService.getStudentList(1, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
          next: (resp: any) => {
            this.stats[0].value = resp.data.length.toLocaleString();
            this.stats[0].label = 'Étudiants Enregistrés';
            this.stats[0].trend = `Total dans votre base`;
        },
        error: (err) => {
          this.logger.error('Error loading statistics:', err);
          // Fallback to demo data on error
          this.stats[0].value = '0';
          this.stats[0].label = 'Étudiants';
          this.stats[0].trend = 'Aucune donnée';
        }
      });
  }

  // Use trackBy for ngFor performance
  trackByFeature(index: number, feature: Feature): string {
    return feature.title;
  }

  // Improved navigation with fallback
  navigateToFeature(route: string): void {
    // Validate route exists in router config
    const routePath = route.replace(/^\//, '');
    if (route && this.router.config.some(r => r.path === routePath)) {
      this.router.navigate([route]);
    } else {
      // Fallback: navigate to not-found or show toast
      this.router.navigate(['/not-found']);
      // Optionally: this.toastService?.error('Page non trouvée');
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
