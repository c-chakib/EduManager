import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ListeEtudiantsComponent } from './etudiants/liste-etudiants/liste-etudiants.component';
import { DetailsEtudiantsComponent } from './etudiants/details-etudiants/details-etudiants.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EtudiantFormComponent } from './etudiants/etudiant-form/etudiant-form.component';
import { HomeComponent } from './home/home.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ProfileComponent } from './profile/profile.component';
import { DashboardComponent } from './dashboard/dashboard.component';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { DocumentationComponent } from './pages/documentation/documentation.component';
import { GuideComponent } from './pages/guide/guide.component';
import { FaqComponent } from './pages/faq/faq.component';
import { SupportComponent } from './pages/support/support.component';
import { PrivacyComponent } from './pages/privacy/privacy.component';
import { TermsComponent } from './pages/terms/terms.component';
import { CookiesComponent } from './pages/cookies/cookies.component';
import { AccessibilityComponent } from './pages/accessibility/accessibility.component';
import { ChatbotComponent } from './shared/chatbot/chatbot.component';
import { NewlineToBrPipe } from './shared/pipes/newline-to-br.pipe';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { CardComponent } from './shared/components/card/card.component';
import { ButtonComponent } from './shared/components/button/button.component';
import { AlertComponent } from './shared/components/alert/alert.component';
import { BadgeComponent } from './shared/components/badge/badge.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from './shared/components/empty-state/empty-state.component';
import { TableComponent } from './shared/components/table/table.component';
import { AdminApprovalsComponent } from './admin/admin-approvals/admin-approvals.component';
import { UserManagementComponent } from './admin/user-management/user-management.component';
import { RoleBadgeComponent } from './shared/components/role-badge/role-badge.component';
import { RecentActivityComponent } from './shared/recent-activity/recent-activity.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { JournalLogComponent } from './admin/journal-log/journal-log.component';
import { GoogleAuthService } from './services/google-auth.service';

@NgModule({
  declarations: [
    AppComponent,
    // ListeEtudiantsComponent, // declared in EtudiantsModule
    // DetailsEtudiantsComponent, // declared in EtudiantsModule
    // EtudiantFormComponent, // declared in EtudiantsModule
    HomeComponent,
    NavbarComponent,
    FooterComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    DashboardComponent,
    DocumentationComponent,
    GuideComponent,
    FaqComponent,
    SupportComponent,
    PrivacyComponent,
    TermsComponent,
    CookiesComponent,
    AccessibilityComponent,
    ChatbotComponent,
    NewlineToBrPipe,
    AdminApprovalsComponent,
    UserManagementComponent,
    RecentActivityComponent,
  NotFoundComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
  CommonModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    // Custom Components
    ToastContainerComponent,
    CardComponent,
    ButtonComponent,
    AlertComponent,
    BadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
  TableComponent,
  RoleBadgeComponent,
    // PrimeNG Modules
    ButtonModule,
    CardModule,
    RippleModule,
    TooltipModule,
    BadgeModule,
    AvatarModule,
    DividerModule,
    ConfirmDialogModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    ConfirmationService
  ],
  bootstrap: [AppComponent],
  schemas: [NO_ERRORS_SCHEMA]
})
export class AppModule { }
