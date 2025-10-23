import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-role-badge',
  standalone: true,
  template: `
    <span 
      class="role-badge" 
      [style.background-color]="getRoleColor()"
      [title]="getRoleLabel()">
      {{ getRoleIcon() }} {{ getRoleLabel() }}
    </span>
  `,
  styles: [`
    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
  `]
})
export class RoleBadgeComponent {
  @Input() role?: 'super-admin' | 'admin' | 'teacher' | 'student' | 'moderator' | 'user';

  getRoleColor(): string {
    switch (this.role) {
      case 'super-admin': return '#ef4444'; // red
      case 'admin': return '#8b5cf6'; // violet
      case 'teacher': return '#10b981'; // emerald
      case 'student': return '#3b82f6'; // blue
      case 'moderator': return '#f59e0b'; // amber
      default: return '#6b7280'; // gray
    }
  }

  getRoleIcon(): string {
    switch (this.role) {
      case 'super-admin': return '👑';
      case 'admin': return '🛡️';
      case 'teacher': return '👨‍🏫';
      case 'student': return '🎓';
      case 'moderator': return '🔰';
      default: return '👤';
    }
  }

  getRoleLabel(): string {
    switch (this.role) {
      case 'super-admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'teacher': return 'Enseignant';
      case 'student': return 'Étudiant';
      case 'moderator': return 'Modérateur';
      default: return 'Utilisateur';
    }
  }
}
