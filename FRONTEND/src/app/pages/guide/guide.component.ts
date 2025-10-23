import { Component } from '@angular/core';

@Component({
  selector: 'app-guide',
  standalone: false,
  templateUrl: './guide.component.html',
  styleUrl: './guide.component.css'
})
export class GuideComponent {
  steps = [
    {
      title: 'Connexion à la plateforme',
      icon: 'fas fa-sign-in-alt',
      content: 'Pour accéder à EduManager, utilisez vos identifiants fournis par votre administrateur. En cas d\'oubli du mot de passe, cliquez sur "Mot de passe oublié" pour le réinitialiser.'
    },
    {
      title: 'Navigation dans le tableau de bord',
      icon: 'fas fa-tachometer-alt',
      content: 'Le tableau de bord principal vous donne un aperçu complet de votre activité. Accédez rapidement aux étudiants, dashboard, et paramètres via le menu de navigation.'
    },
    {
      title: 'Gestion des étudiants',
      icon: 'fas fa-user-graduate',
      content: 'Ajoutez de nouveaux étudiants en cliquant sur le bouton "Ajouter". Remplissez le formulaire avec les informations requises : nom, prénom, email, et filière.'
    },
    {
      title: 'Modification des données',
      icon: 'fas fa-edit',
      content: 'Pour modifier les informations d\'un étudiant, cliquez sur son nom dans la liste, puis sur le bouton "Modifier". Effectuez vos changements et enregistrez.'
    },
    {
      title: 'Consultation du dashboard',
      icon: 'fas fa-chart-line',
      content: 'La section Dashboard offre des graphiques interactifs et des rapports détaillés sur les performances et l\'évolution des inscriptions.'
    },
    {
      title: 'Exportation des données',
      icon: 'fas fa-file-export',
      content: 'Exportez vos données au format CSV ou Excel pour une analyse externe. Utilisez les filtres pour sélectionner les données à exporter.'
    }
  ];
}
