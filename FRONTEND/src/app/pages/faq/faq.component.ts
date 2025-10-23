import { Component } from '@angular/core';

@Component({
  selector: 'app-faq',
  standalone: false,
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.css'
})
export class FaqComponent {
  faqs = [
    {
      category: 'Général',
      icon: 'fas fa-info-circle',
      questions: [
        {
          question: 'Qu\'est-ce qu\'EduManager ?',
          answer: 'EduManager est une plateforme complète de gestion académique qui permet aux établissements d\'enseignement de gérer efficacement leurs étudiants, cours, et données administratives.',
          isOpen: false
        },
        {
          question: 'Comment puis-je accéder à EduManager ?',
          answer: 'Vous pouvez accéder à EduManager via notre site web en utilisant les identifiants fournis par votre administrateur. La plateforme est accessible depuis n\'importe quel navigateur moderne.',
          isOpen: false
        }
      ]
    },
    {
      category: 'Compte et sécurité',
      icon: 'fas fa-shield-alt',
      questions: [
        {
          question: 'Comment réinitialiser mon mot de passe ?',
          answer: 'Cliquez sur "Mot de passe oublié" sur la page de connexion, entrez votre email, et suivez les instructions envoyées par email pour créer un nouveau mot de passe.',
          isOpen: false
        },
        {
          question: 'Mes données sont-elles sécurisées ?',
          answer: 'Oui, nous utilisons un cryptage SSL/TLS pour toutes les communications et stockons les données selon les normes de sécurité les plus strictes. Consultez notre politique de confidentialité pour plus de détails.',
          isOpen: false
        }
      ]
    },
    {
      category: 'Gestion des étudiants',
      icon: 'fas fa-users',
      questions: [
        {
          question: 'Comment ajouter un nouvel étudiant ?',
          answer: 'Connectez-vous à votre compte, accédez à la section "Étudiants", cliquez sur "Ajouter un étudiant", et remplissez le formulaire avec les informations requises.',
          isOpen: false
        },
        {
          question: 'Puis-je importer des données en masse ?',
          answer: 'Oui, vous pouvez importer des listes d\'étudiants via un fichier CSV ou Excel. Contactez le support pour obtenir le modèle de fichier approprié.',
          isOpen: false
        }
      ]
    },
    {
      category: 'Support technique',
      icon: 'fas fa-headset',
      questions: [
        {
          question: 'Que faire si je rencontre un problème technique ?',
          answer: 'Contactez notre équipe de support via la page Support. Nous nous engageons à répondre à toutes les demandes dans les 24 heures ouvrables.',
          isOpen: false
        },
        {
          question: 'Y a-t-il une application mobile ?',
          answer: 'Une application mobile est actuellement en développement et sera disponible prochainement sur iOS et Android.',
          isOpen: false
        }
      ]
    }
  ];

  toggleQuestion(categoryIndex: number, questionIndex: number): void {
    this.faqs[categoryIndex].questions[questionIndex].isOpen = 
      !this.faqs[categoryIndex].questions[questionIndex].isOpen;
  }
}
