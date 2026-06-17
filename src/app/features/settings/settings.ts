import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../core/services/storage.service';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-settings',
  imports: [FormsModule, Icon],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">Configuracoes</p>
        <h2 class="mt-1 text-3xl font-bold">Dados, tema e manutencao</h2>
      </div>

      <div class="grid gap-6 xl:grid-cols-2">
        <article class="panel space-y-4">
          <h3 class="text-xl font-bold">Tema</h3>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" class="btn-secondary" [class.ring-2]="storage.theme() === 'light'" (click)="storage.setTheme('light')"><app-icon name="sun" /> Claro</button>
            <button type="button" class="btn-secondary" [class.ring-2]="storage.theme() === 'dark'" (click)="storage.setTheme('dark')"><app-icon name="moon" /> Escuro</button>
          </div>
        </article>

        <article class="panel space-y-4">
          <h3 class="text-xl font-bold">Exportar</h3>
          <p class="text-sm text-stone-600 dark:text-stone-300">Baixe um arquivo JSON com reuniões, presenças, reflexões e preferência de tema.</p>
          <button type="button" class="btn-primary" (click)="downloadJson()"><app-icon name="download" /> Exportar JSON</button>
        </article>

        <article class="panel space-y-4">
          <h3 class="text-xl font-bold">Importar</h3>
          <input #fileInput class="field" type="file" accept="application/json,.json" (change)="importFile($event)" />
          <textarea class="field min-h-36" [(ngModel)]="importText" placeholder="Ou cole aqui um JSON exportado anteriormente."></textarea>
          <button type="button" class="btn-secondary" (click)="importTextData()"><app-icon name="upload" /> Importar texto</button>
        </article>

        <article class="panel space-y-4 border-red-200 dark:border-red-900">
          <h3 class="text-xl font-bold text-red-700 dark:text-red-200">Limpar dados</h3>
          <p class="text-sm text-stone-600 dark:text-stone-300">Digite LIMPAR para confirmar a remoção de todas as reuniões e reflexoes locais.</p>
          <input class="field" [(ngModel)]="confirmation" placeholder="LIMPAR" />
          <button type="button" class="btn-danger" [disabled]="confirmation() !== 'LIMPAR'" (click)="clearAll()"><app-icon name="trash" /> Limpar tudo</button>
        </article>
      </div>
    </section>
  `
})
export class Settings {
  readonly storage = inject(StorageService);
  readonly confirmation = signal('');
  importText = '';
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  downloadJson(): void {
    const blob = new Blob([this.storage.exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aa-dados-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  importFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    file.text().then((text) => this.storage.importData(text));
  }

  importTextData(): void {
    if (this.storage.importData(this.importText)) {
      this.importText = '';
      this.fileInput?.nativeElement.value && (this.fileInput.nativeElement.value = '');
    }
  }

  clearAll(): void {
    if (confirm('Tem certeza que deseja limpar todos os dados locais?')) {
      this.storage.clearAll();
      this.confirmation.set('');
    }
  }
}
