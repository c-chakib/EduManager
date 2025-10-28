import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JournalLogComponent } from './journal-log.component';

const routes: Routes = [
  { path: '', component: JournalLogComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JournalLogRoutingModule {}
