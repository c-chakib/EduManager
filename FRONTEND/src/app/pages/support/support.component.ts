import { Component } from '@angular/core';
import { LoggerService } from '../../core/services/logger.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-support',
  standalone: false,
  templateUrl: './support.component.html',
  styleUrl: './support.component.css'
})
export class SupportComponent {
  constructor(
    private logger: LoggerService,
    private toastService: ToastService
  ) {}
  contactMethods = [
    {
      title: 'Email',
      icon: 'fas fa-envelope',
      info: 'contact@edumanager.com',
      description: 'Réponse sous 24h ouvrables',
      link: 'mailto:contact@edumanager.com'
    },
    {
      title: 'Téléphone',
      icon: 'fas fa-phone',
      info: '+212 662 12 7709',
      description: 'Lun-Ven: 9h-18h',
      link: 'tel:+212662127709'
    },
    {
      title: 'Chat en direct',
      icon: 'fas fa-comments',
      info: 'Disponible maintenant',
      description: 'Support instantané'
      // No link, handled by button
    }
  ];

  openChatbot(): void {
    // Implement chatbot widget opening logic here
    // Example: window.dispatchEvent(new Event('open-chatbot'));
    // Or call a chatbot service if available
    console.log('Chatbot opened');
  }

  supportForm = {
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'normal'
  };

  submitSupport(): void {
    this.logger.info('Support request submitted:', this.supportForm);
    // Implement actual submission logic here
    this.toastService.success('Votre demande a été envoyée avec succès. Notre équipe vous contactera bientôt.', 'Demande envoyée');
    this.resetForm();
  }

  resetForm(): void {
    this.supportForm = {
      name: '',
      email: '',
      subject: '',
      message: '',
      priority: 'normal'
    };
  }
}
