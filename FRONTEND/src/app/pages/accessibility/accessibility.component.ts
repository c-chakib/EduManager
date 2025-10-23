import { Component } from '@angular/core';

@Component({
  selector: 'app-accessibility',
  standalone: false,
  templateUrl: './accessibility.component.html',
  styleUrl: './accessibility.component.css'
})
export class AccessibilityComponent {
  features = [
    {
      title: 'Navigation au clavier',
      icon: 'fas fa-keyboard',
      content: 'Naviguez facilement dans toute l\'interface en utilisant uniquement votre clavier. Utilisez Tab pour vous déplacer entre les éléments et Entrée pour les activer.'
    },
    {
      title: 'Lecteurs d\'écran',
      icon: 'fas fa-volume-up',
      content: 'Notre plateforme est compatible avec les principaux lecteurs d\'écran (JAWS, NVDA, VoiceOver). Tous les éléments sont correctement étiquetés pour une navigation vocale optimale.'
    },
    {
      title: 'Contraste élevé',
      icon: 'fas fa-adjust',
      content: 'Les couleurs et contrastes respectent les normes WCAG 2.1 niveau AA pour assurer une lisibilité maximale. Les textes importants maintiennent un ratio de contraste de 4.5:1 minimum.'
    },
    {
      title: 'Taille de texte ajustable',
      icon: 'fas fa-text-height',
      content: 'Augmentez ou diminuez la taille du texte jusqu\'à 200% sans perte de contenu ou de fonctionnalité. Utilisez les commandes de votre navigateur (Ctrl + / Ctrl -).'
    },
    {
      title: 'Formulaires accessibles',
      icon: 'fas fa-wpforms',
      content: 'Tous les champs de formulaire sont clairement étiquetés avec des instructions et messages d\'erreur explicites pour faciliter leur utilisation.'
    },
    {
      title: 'Contenus multimédias',
      icon: 'fas fa-closed-captioning',
      content: 'Les vidéos incluent des sous-titres et transcriptions. Les contenus audio disposent d\'alternatives textuelles pour garantir l\'accessibilité à tous.'
    }
  ];

  shortcuts = [
    { key: 'Tab', action: 'Naviguer vers l\'élément suivant' },
    { key: 'Shift + Tab', action: 'Naviguer vers l\'élément précédent' },
    { key: 'Entrée', action: 'Activer un bouton ou un lien' },
    { key: 'Espace', action: 'Activer une case à cocher' },
    { key: 'Échap', action: 'Fermer une fenêtre modale' },
    { key: 'Flèches', action: 'Naviguer dans les menus et listes' }
  ];
}
