import { Component } from '@angular/core';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-documentation',
  standalone: false,
  templateUrl: './documentation.component.html',
  styleUrl: './documentation.component.css'
})
export class DocumentationComponent {
  constructor(private logger: LoggerService) {}
  sections = [
    {
      title: 'Introduction',
      icon: 'fas fa-rocket',
      content: 'Bienvenue dans la documentation EduManager. Ce guide vous aidera à tirer le meilleur parti de notre plateforme de gestion académique.'
    },
    {
      title: 'Démarrage Rapide',
      icon: 'fas fa-bolt',
      content: 'Commencez en quelques minutes avec notre guide de démarrage rapide.'
    },
    {
      title: 'Gestion des Étudiants',
      icon: 'fas fa-users',
      content: 'Apprenez à gérer efficacement vos étudiants, leurs informations et leur parcours académique.'
    },
    {
      title: 'Rapports et Dashboard',
      icon: 'fas fa-chart-bar',
      content: 'Générez des rapports détaillés et suivez les performances de votre établissement.'
    },
    {
      title: 'Paramètres et Configuration',
      icon: 'fas fa-cog',
      content: 'Personnalisez EduManager selon les besoins de votre établissement.'
    }
  ];

  goToSection(section: any): void {
    // TODO: Implement navigation or modal logic for documentation sections
    this.logger.info('Navigating to section:', section.title);
  }
}
