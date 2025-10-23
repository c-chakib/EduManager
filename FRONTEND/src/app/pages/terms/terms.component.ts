import { Component } from '@angular/core';

@Component({
  selector: 'app-terms',
  standalone: false,
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.css'
})
export class TermsComponent {
  currentDate = new Date();
  
  sections = [
    {
      title: 'Acceptation des conditions',
      icon: 'fas fa-check-circle',
      content: 'En accédant et en utilisant EduManager, vous acceptez d\'être lié par ces conditions générales d\'utilisation. Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser notre service.'
    },
    {
      title: 'Utilisation du service',
      icon: 'fas fa-laptop',
      content: 'Vous vous engagez à utiliser EduManager de manière responsable et conforme aux lois en vigueur. Toute utilisation abusive ou frauduleuse peut entraîner la suspension de votre compte.'
    },
    {
      title: 'Propriété intellectuelle',
      icon: 'fas fa-copyright',
      content: 'Tous les contenus, logiciels, et matériels disponibles sur EduManager sont protégés par les droits de propriété intellectuelle. Toute reproduction non autorisée est interdite.'
    },
    {
      title: 'Responsabilités',
      icon: 'fas fa-exclamation-triangle',
      content: 'Nous nous efforçons de maintenir un service fiable et sécurisé, mais ne pouvons garantir une disponibilité ininterrompue. Vous êtes responsable de la sauvegarde de vos données.'
    },
    {
      title: 'Modifications du service',
      icon: 'fas fa-sync-alt',
      content: 'Nous nous réservons le droit de modifier, suspendre ou interrompre tout ou partie du service à tout moment, avec ou sans préavis.'
    },
    {
      title: 'Résiliation',
      icon: 'fas fa-ban',
      content: 'Vous pouvez résilier votre compte à tout moment. Nous pouvons également suspendre ou résilier votre accès en cas de violation de ces conditions.'
    }
  ];
}
