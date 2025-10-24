import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// Lazy loading: remove direct imports of etudiants components
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ProfileComponent } from './profile/profile.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AuthGuard, NoAuthGuard, RoleGuard } from './guards/auth.guard';
import { DocumentationComponent } from './pages/documentation/documentation.component';
import { GuideComponent } from './pages/guide/guide.component';
import { FaqComponent } from './pages/faq/faq.component';
import { SupportComponent } from './pages/support/support.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { TermsComponent } from './pages/terms/terms.component';
import { CookiesComponent } from './pages/cookies/cookies.component';
import { AccessibilityComponent } from './pages/accessibility/accessibility.component';
import { AdminApprovalsComponent } from './admin/admin-approvals/admin-approvals.component';
import { UserManagementComponent } from './admin/user-management/user-management.component';
import { ChatPageComponent } from './pages/chat/chat.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { 
    path: 'auth/login', 
    component: LoginComponent,
    canActivate: [NoAuthGuard]
  },
  { 
    path: 'auth/register', 
    component: RegisterComponent,
    canActivate: [NoAuthGuard]
  },
  
  // Routes Sécurisées (Auth Required)
  { 
    path: 'profile', 
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [RoleGuard],
    data: { roles: ['admin'] }
  },
  // Redirect legacy approvals route to unified user management
  {
    path: 'admin/approvals',
    redirectTo: 'admin/users',
    pathMatch: 'full'
  },
  {
    path: 'admin/users',
    component: UserManagementComponent,
    canActivate: [RoleGuard],
    data: { roles: ['super-admin'] }
  },
  {
    path: 'chat',
    component: ChatPageComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'etudiants',
    loadChildren: () => import('./etudiants/etudiants.module').then(m => m.EtudiantsModule),
    canActivate: [AuthGuard]
  },
  
  // Routes Mode Découverte (Public - Demo Data)
  { 
    path: 'demo/profile', 
    component: ProfileComponent
  },
  {
    path: 'demo/etudiants',
    loadChildren: () => import('./etudiants/etudiants.module').then(m => m.EtudiantsModule)
  },
  { path: 'documentation', component: DocumentationComponent },
  { path: 'guide', component: GuideComponent },
  { path: 'faq', component: FaqComponent },
  { path: 'support', component: SupportComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'cookies', component: CookiesComponent },
  { path: 'accessibility', component: AccessibilityComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'top',
    anchorScrolling: 'enabled',
    scrollOffset: [0, 64]
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
