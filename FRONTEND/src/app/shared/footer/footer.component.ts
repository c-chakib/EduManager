import { Component } from '@angular/core';
import { ChatbotService } from '../services/chatbot.service';

@Component({
  selector: 'app-footer',
  standalone: false,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  
  constructor(private chatbotService: ChatbotService) {}
  
  quickLinks = [
    { name: 'Accueil', route: '/' },
    { name: 'Étudiants', route: '/etudiants' },
    { name: 'Ajouter Étudiant', route: '/etudiants/form' },
    { name: 'Dashboard', route: '#' }
  ];

  resources = [
    { name: 'Documentation', route: '/documentation' },
    { name: 'Guide d\'utilisation', route: '/guide' },
    { name: 'FAQ', route: '/faq' },
    { name: 'Support', route: '/support' }
  ];

  socialLinks = [
    { name: 'Facebook', icon: 'fab fa-facebook-f', url: 'https://facebook.com' },
    { name: 'Twitter', icon: 'fab fa-twitter', url: 'https://twitter.com' },
    { name: 'LinkedIn', icon: 'fab fa-linkedin-in', url: 'https://linkedin.com' },
    { name: 'Instagram', icon: 'fab fa-instagram', url: 'https://instagram.com' },
    { name: 'GitHub', icon: 'fab fa-github', url: 'https://github.com' },
    { name: 'YouTube', icon: 'fab fa-youtube', url: 'https://youtube.com' }
  ];

  openChatbot(): void {
    this.chatbotService.openChat();
  }
}
