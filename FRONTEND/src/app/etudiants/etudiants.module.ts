import { MultiSelectModule } from 'primeng/multiselect';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../shared/components/button/button.component';
import { AlertComponent } from '../shared/components/alert/alert.component';
import { BadgeComponent } from '../shared/components/badge/badge.component';
import { CardComponent } from '../shared/components/card/card.component';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { ListeEtudiantsComponent } from './liste-etudiants/liste-etudiants.component';
import { CeilPipe } from '../shared/pipes/ceil.pipe';
import { DetailsEtudiantsComponent } from './details-etudiants/details-etudiants.component';
import { EtudiantFormComponent } from './etudiant-form/etudiant-form.component';



import { RouterModule, Routes } from '@angular/router';
import { StudentsResolver, StudentDetailResolver } from '../resolvers';

const routes: Routes = [
  { 
    path: '', 
    component: ListeEtudiantsComponent,
    resolve: {
      studentsData: StudentsResolver
    }
  },
  { path: 'form', component: EtudiantFormComponent },
  { path: 'edit/:id', component: EtudiantFormComponent },
  { 
    path: ':id', 
    component: DetailsEtudiantsComponent,
    resolve: {
      studentData: StudentDetailResolver
    }
  },
];

@NgModule({
  declarations: [
    ListeEtudiantsComponent,
    DetailsEtudiantsComponent,
    EtudiantFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    ButtonComponent,
    AlertComponent,
    BadgeComponent,
    CardComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CeilPipe,
    MultiSelectModule
  ]
})
export class EtudiantsModule { }
