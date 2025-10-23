import { Component } from '@angular/core';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-cookies',
  standalone: false,
  templateUrl: './cookies.component.html',
  styleUrl: './cookies.component.css'
})
export class CookiesComponent {
  constructor(
    private logger: LoggerService,
    private toastService: ToastService
  ) {}
  cookieTypes = [
    {
      title: 'Cookies essentiels',
      icon: 'fas fa-cookie',
      description: 'Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés.',
      examples: 'Session utilisateur, préférences de langue, authentification',
      required: true
    },
    {
      title: 'Cookies analytiques',
      icon: 'fas fa-chart-bar',
      description: 'Ces cookies nous aident à comprendre comment les visiteurs interagissent avec notre site.',
      examples: 'Google Analytics, dashboard de pages vues, temps de session',
      required: false
    },
    {
      title: 'Cookies fonctionnels',
      icon: 'fas fa-cog',
      description: 'Ces cookies permettent des fonctionnalités améliorées et la personnalisation.',
      examples: 'Préférences d\'affichage, paramètres sauvegardés',
      required: false
    }
  ];

  cookieSettings = {
    essential: true,
    analytics: true,
    functional: true
  };

  savePreferences(): void {
    this.logger.info('Cookie preferences saved:', this.cookieSettings);
    this.toastService.success('Vos préférences de cookies ont été enregistrées.', 'Préférences enregistrées');
  }

  acceptAll(): void {
    this.cookieSettings = {
      essential: true,
      analytics: true,
      functional: true
    };
    this.savePreferences();
  }

  rejectAll(): void {
    this.cookieSettings = {
      essential: true,
      analytics: false,
      functional: false
    };
    this.savePreferences();
  }
}
