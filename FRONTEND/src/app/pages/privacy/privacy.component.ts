import { Component } from '@angular/core';

@Component({
  selector: 'app-privacy',
  standalone: false,
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.css'
})
export class PrivacyComponent {
  currentDate = new Date();
  
  sections = [
    {
      title: 'Collecte des données',
      icon: 'fas fa-database',
      content: 'Nous collectons uniquement les données nécessaires au fonctionnement de notre service : informations de compte (nom, email), données académiques des étudiants, et données d\'utilisation pour améliorer notre plateforme.'
    },
    {
      title: 'Utilisation des données',
      icon: 'fas fa-user-shield',
      content: 'Vos données sont utilisées exclusivement pour fournir et améliorer nos services. Nous ne vendons ni ne partageons vos informations personnelles avec des tiers à des fins marketing.'
    },
    {
      title: 'Sécurité',
      icon: 'fas fa-lock',
      content: 'Nous mettons en œuvre des mesures de sécurité avancées incluant le cryptage SSL/TLS, l\'authentification sécurisée, et des sauvegardes régulières pour protéger vos données.'
    },
    {
      title: 'Droits des utilisateurs',
      icon: 'fas fa-balance-scale',
      content: 'Conformément au RGPD, vous disposez d\'un droit d\'accès, de rectification, de suppression et de portabilité de vos données. Contactez-nous pour exercer ces droits.'
    },
    {
      title: 'Cookies',
      icon: 'fas fa-cookie-bite',
      content: 'Nous utilisons des cookies essentiels pour le fonctionnement du site et des cookies analytiques pour améliorer l\'expérience utilisateur. Vous pouvez gérer vos préférences cookies à tout moment.'
    },
    {
      title: 'Conservation des données',
      icon: 'fas fa-calendar-alt',
      content: 'Vos données sont conservées pendant la durée nécessaire aux fins pour lesquelles elles ont été collectées, sauf obligation légale de conservation plus longue.'
    }
  ];
}
