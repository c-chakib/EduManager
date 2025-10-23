# 🎨 EduManager - Reusable UI Component Library

Complete guide for using the new reusable components in your EduManager application.

---

## 📦 Available Components

### 1. **Button Component** (`app-button`)

Modern, accessible button with loading states and variants.

#### Usage

```html
<!-- Primary Button -->
<app-button 
  variant="primary" 
  size="md"
  (clicked)="onSubmit()">
  Enregistrer
</app-button>

<!-- Button with Icon -->
<app-button 
  variant="success" 
  icon="pi pi-check"
  iconPosition="left">
  Valider
</app-button>

<!-- Loading Button -->
<app-button 
  [loading]="isSubmitting"
  loadingText="Enregistrement en cours...">
  Soumettre
</app-button>

<!-- Full Width Button -->
<app-button 
  variant="primary"
  [fullWidth]="true">
  Continuer
</app-button>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info' \| 'ghost'` | `'primary'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `disabled` | `boolean` | `false` | Disabled state |
| `loading` | `boolean` | `false` | Show loading spinner |
| `loadingText` | `string` | `undefined` | Text to show when loading |
| `icon` | `string` | `undefined` | PrimeIcons class name |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position |
| `fullWidth` | `boolean` | `false` | Full width button |
| `rounded` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'full'` | `'lg'` | Border radius |

#### Events

- `(clicked)`: Emitted when button is clicked (not disabled/loading)

---

### 2. **Card Component** (`app-card`)

Container component for grouped content.

#### Usage

```html
<!-- Simple Card -->
<app-card 
  title="Informations de l'étudiant"
  subtitle="Détails complets du profil"
  icon="pi pi-user">
  
  <p>Contenu de la carte...</p>
  
  <div footer class="flex justify-end gap-2">
    <app-button variant="ghost">Annuler</app-button>
    <app-button variant="primary">Enregistrer</app-button>
  </div>
</app-card>

<!-- Hoverable Card -->
<app-card 
  title="Statistiques"
  variant="elevated"
  [hover]="true"
  [clickable]="true">
  
  <div class="grid grid-cols-2 gap-4">
    <div>
      <p class="text-3xl font-bold">{{ studentCount }}</p>
      <p class="text-gray-600">Étudiants</p>
    </div>
  </div>
</app-card>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `undefined` | Card title |
| `subtitle` | `string` | `undefined` | Card subtitle |
| `icon` | `string` | `undefined` | Header icon class |
| `variant` | `'default' \| 'bordered' \| 'elevated' \| 'flat'` | `'default'` | Card style |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Inner padding |
| `hover` | `boolean` | `false` | Hover effect |
| `clickable` | `boolean` | `false` | Cursor pointer |

#### Content Projection

- **Default slot**: Main content
- `[header]`: Custom header content
- `[header-actions]`: Action buttons in header
- `[footer]`: Footer content

---

### 3. **Badge Component** (`app-badge`)

Status indicator or label.

#### Usage

```html
<!-- Status Badges -->
<app-badge variant="success">Actif</app-badge>
<app-badge variant="danger">Inactif</app-badge>
<app-badge variant="warning">En attente</app-badge>

<!-- With Icon -->
<app-badge variant="info" icon="pi pi-info-circle">
  Nouveau
</app-badge>

<!-- Outline Style -->
<app-badge variant="primary" [outline]="true">
  Premium
</app-badge>

<!-- Closable Badge -->
<app-badge variant="secondary" [closable]="true">
  Informatique
</app-badge>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'success' \| 'danger' \| 'warning' \| 'info'` | `'primary'` | Badge color |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `icon` | `string` | `undefined` | Icon class |
| `closable` | `boolean` | `false` | Show close button |
| `rounded` | `'sm' \| 'md' \| 'lg' \| 'full'` | `'full'` | Border radius |
| `outline` | `boolean` | `false` | Outline style |

---

### 4. **Loading Spinner** (`app-loading-spinner`)

Loading indicator with multiple styles.

#### Usage

```html
<!-- Inline Spinner -->
<app-loading-spinner size="md" color="primary"></app-loading-spinner>

<!-- Centered with Message -->
<app-loading-spinner 
  size="lg"
  [centered]="true"
  message="Chargement des données...">
</app-loading-spinner>

<!-- Full Page Overlay -->
<app-loading-spinner 
  *ngIf="isLoading"
  size="xl"
  color="white"
  [overlay]="true"
  message="Traitement en cours...">
</app-loading-spinner>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Spinner size |
| `color` | `'primary' \| 'white' \| 'gray'` | `'primary'` | Spinner color |
| `centered` | `boolean` | `false` | Center vertically |
| `overlay` | `boolean` | `false` | Full page overlay |
| `message` | `string` | `undefined` | Loading message |

---

### 5. **Alert Component** (`app-alert`)

Notification or message box.

#### Usage

```html
<!-- Success Alert -->
<app-alert variant="success" title="Succès!">
  L'étudiant a été ajouté avec succès.
</app-alert>

<!-- Error Alert with Border -->
<app-alert 
  variant="error" 
  title="Erreur"
  [bordered]="true"
  (closed)="onAlertClose()">
  Une erreur est survenue lors de l'enregistrement.
</app-alert>

<!-- Warning Alert (Not Closable) -->
<app-alert 
  variant="warning" 
  [closable]="false">
  Veuillez vérifier vos informations avant de continuer.
</app-alert>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | Alert type |
| `title` | `string` | `undefined` | Alert title |
| `closable` | `boolean` | `true` | Show close button |
| `bordered` | `boolean` | `false` | Left border style |

#### Events

- `(closed)`: Emitted when close button clicked

---

### 6. **Toast Service & Container**

Global notification system.

#### Setup (in app.component.html)

```html
<div class="app-container">
  <app-navbar></app-navbar>
  <router-outlet></router-outlet>
  <app-footer></app-footer>
  
  <!-- Add Toast Container -->
  <app-toast-container></app-toast-container>
</div>
```

#### Usage (in components)

```typescript
import { ToastService } from '@app/shared/services/toast.service';

export class YourComponent {
  constructor(private toastService: ToastService) {}

  onSuccess() {
    this.toastService.success(
      'L\'étudiant a été ajouté avec succès',
      'Succès',
      5000
    );
  }

  onError() {
    this.toastService.error(
      'Une erreur est survenue',
      'Erreur'
    );
  }

  onWarning() {
    this.toastService.warning(
      'Veuillez vérifier vos informations',
      'Attention'
    );
  }

  onInfo() {
    this.toastService.info(
      'Vos données ont été synchronisées',
      'Information'
    );
  }

  // Or use the generic method
  onCustom() {
    this.toastService.show({
      message: 'Message personnalisé',
      title: 'Titre',
      variant: 'success',
      duration: 3000,
      closable: true
    });
  }
}
```

---

### 7. **Empty State** (`app-empty-state`)

Display when no data is available.

#### Usage

```html
<!-- With Icon -->
<app-empty-state
  icon="pi pi-inbox"
  title="Aucun étudiant trouvé"
  description="Commencez par ajouter votre premier étudiant">
  
  <div action>
    <app-button 
      variant="primary"
      icon="pi pi-plus"
      (clicked)="onAddStudent()">
      Ajouter un étudiant
    </app-button>
  </div>
</app-empty-state>

<!-- With Image -->
<app-empty-state
  image="/assets/empty-students.svg"
  title="Aucune donnée disponible"
  size="lg">
</app-empty-state>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `string` | `undefined` | Icon class |
| `image` | `string` | `undefined` | Image URL |
| `title` | `string` | `'Aucune donnée disponible'` | Title text |
| `description` | `string` | `undefined` | Description text |
| `actionText` | `string` | `undefined` | Action button text |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Component size |

---

### 8. **Table Component** (`app-table`)

Sortable data table.

#### Usage

```typescript
// In component .ts
columns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'nom', label: 'Nom', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'filiere', label: 'Filière', sortable: false },
  { key: 'actions', label: 'Actions', align: 'right' }
];

onSort(event: { key: string; direction: 'asc' | 'desc' }) {
  // Handle sorting logic
}
```

```html
<!-- In component .html -->
<app-table 
  [columns]="columns"
  [empty]="students.length === 0"
  emptyMessage="Aucun étudiant trouvé"
  [hasFooter]="true"
  (sort)="onSort($event)">
  
  <!-- Table Rows -->
  <tr *ngFor="let student of students" class="hover:bg-gray-50 transition-colors">
    <td class="px-6 py-4 whitespace-nowrap text-sm">{{ student.id }}</td>
    <td class="px-6 py-4 whitespace-nowrap">
      <div class="font-medium text-gray-900">{{ student.nom }} {{ student.prenom }}</div>
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ student.email }}</td>
    <td class="px-6 py-4 whitespace-nowrap">
      <app-badge variant="info">{{ student.filiere }}</app-badge>
    </td>
    <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
      <app-button size="sm" variant="ghost" icon="pi pi-pencil"></app-button>
      <app-button size="sm" variant="ghost" icon="pi pi-trash"></app-button>
    </td>
  </tr>

  <!-- Footer (Pagination) -->
  <div footer class="flex items-center justify-between">
    <p class="text-sm text-gray-700">
      Affichage de <span class="font-medium">1</span> à <span class="font-medium">10</span> sur <span class="font-medium">{{ total }}</span> résultats
    </p>
    <div class="flex gap-2">
      <app-button size="sm" variant="ghost">Précédent</app-button>
      <app-button size="sm" variant="ghost">Suivant</app-button>
    </div>
  </div>
</app-table>
```

---

## 🎨 Design Tokens

### Colors

Your Tailwind config already has these colors. Use them consistently:

- **Primary**: `blue-600` (main brand color)
- **Success**: `green-600`
- **Danger**: `red-600`
- **Warning**: `yellow-600`
- **Info**: `cyan-600`
- **Gray**: `gray-600` (neutral)

### Spacing

- **xs**: `0.25rem` (4px)
- **sm**: `0.5rem` (8px)
- **md**: `1rem` (16px)
- **lg**: `1.5rem` (24px)
- **xl**: `2rem` (32px)

### Border Radius

- **sm**: `4px`
- **md**: `6px`
- **lg**: `8px`
- **xl**: `12px`
- **full**: `9999px`

---

## 📋 Example: Complete Form with Components

```html
<app-card title="Ajouter un étudiant" icon="pi pi-user-plus" variant="elevated">
  
  <!-- Alert for validation errors -->
  <app-alert 
    *ngIf="hasErrors"
    variant="error"
    title="Erreur de validation"
    (closed)="clearErrors()">
    Veuillez corriger les erreurs ci-dessous.
  </app-alert>

  <form [formGroup]="studentForm" (ngSubmit)="onSubmit()">
    <div class="space-y-4">
      <!-- Form fields here... -->
    </div>
  </form>

  <div footer class="flex items-center justify-between">
    <app-button 
      variant="ghost"
      (clicked)="onCancel()">
      Annuler
    </app-button>
    
    <app-button 
      variant="primary"
      type="submit"
      [loading]="isSubmitting"
      loadingText="Enregistrement..."
      icon="pi pi-check"
      (clicked)="onSubmit()">
      Enregistrer
    </app-button>
  </div>
</app-card>
```

---

## 🚀 Best Practices

1. **Consistency**: Always use these components instead of custom HTML/CSS
2. **Accessibility**: Components are keyboard-navigable and screen-reader friendly
3. **Theming**: Use Tailwind classes for customization
4. **Loading States**: Always show loading feedback for async operations
5. **Error Handling**: Use toasts for transient messages, alerts for persistent ones
6. **Empty States**: Always provide empty states with helpful actions

---

## 📦 Import & Export

Create a barrel export for easy imports:

```typescript
// shared/components/index.ts
export * from './button/button.component';
export * from './card/card.component';
export * from './badge/badge.component';
export * from './loading-spinner/loading-spinner.component';
export * from './alert/alert.component';
export * from './empty-state/empty-state.component';
export * from './table/table.component';
export * from './toast-container/toast-container.component';
```

Then import in your components:

```typescript
import { 
  ButtonComponent, 
  CardComponent, 
  BadgeComponent 
} from '@app/shared/components';
```

---

## 🎯 Next Steps

1. Add these components to your existing pages
2. Replace custom UI code with reusable components
3. Create page-specific composite components using these primitives
4. Build a Storybook or component showcase page

**Happy coding! 🚀**
