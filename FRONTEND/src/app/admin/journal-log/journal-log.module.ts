import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JournalLogComponent } from './journal-log.component';
import { JournalExportComponent } from './journal-export.component';
import { JournalLogRoutingModule } from './journal-log-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    JournalExportComponent,
    JournalLogRoutingModule,
    // ...other imports...
  ],
  declarations: [
    JournalLogComponent,
    // ...other components...
  ],
  exports: [
    JournalLogComponent
    // ...other exports...
  ]
})
export class JournalLogModule { }