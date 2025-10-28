import { Component, Input } from '@angular/core';
import { saveAs } from 'file-saver';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-journal-export',
  standalone: true,
  template: `
    <button class="btn btn-export"
      [disabled]="!journalEntries || journalEntries.length === 0"
      [title]="!journalEntries || journalEntries.length === 0 ? 'Sélectionnez au moins un log à exporter' : 'Exporter les logs sélectionnés'"
      (click)="exportJournal()">
      <i class="pi pi-download"></i> Exporter le journal
    </button>
  `,
  styles: [`
    .btn-export { margin: 8px 0; }
  `]
})
export class JournalExportComponent {
  @Input() journalEntries: any[] = [];

  constructor(private toast: ToastService) {}

  exportJournal() {
    if (!this.journalEntries || this.journalEntries.length === 0) {
      this.toast.error('Veuillez sélectionner au moins un log à exporter.', 'Export impossible');
      return;
    }
    const data = JSON.stringify(this.journalEntries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    saveAs(blob, 'journal-export.json');
    this.toast.success('Export réussi !', 'Export');
  }
}
