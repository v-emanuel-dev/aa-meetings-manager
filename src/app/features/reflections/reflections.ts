import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Reflection } from '../../core/models/reflection.model';
import { StorageService } from '../../core/services/storage.service';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-reflections',
  imports: [ReactiveFormsModule, DatePipe, Icon],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="text-sm font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">Reflexoes</p>
          <h2 class="mt-1 text-3xl font-bold">Diário do dia</h2>
        </div>
        <label class="relative w-full md:max-w-sm">
          <span class="sr-only">Buscar reflexões</span>
          <input class="field" placeholder="Buscar" [value]="query()" (input)="query.set($any($event.target).value)" />
        </label>
      </div>

      <form class="panel grid gap-4" [formGroup]="form" (ngSubmit)="save()">
        <div class="grid gap-4 md:grid-cols-3">
          <label><span class="label">Data</span><input class="field" type="date" formControlName="date" /></label>
          <label><span class="label">Título opcional</span><input class="field" formControlName="title" /></label>
          <label>
            <span class="label">Reunião associada</span>
            <select class="field" formControlName="meetingId">
              <option value="">Sem associação</option>
              @for (meeting of storage.meetings(); track meeting.id) {
                <option [value]="meeting.id">{{ meeting.date }} - {{ meeting.title }}</option>
              }
            </select>
          </label>
        </div>
        <label>
          <span class="label">Texto</span>
          <textarea class="field min-h-36" formControlName="content" placeholder="Escreva sem precisar organizar tudo agora."></textarea>
        </label>
        <div class="flex gap-2">
          <button class="btn-primary" type="submit" [disabled]="form.invalid"><app-icon name="book" /> {{ editingId() ? 'Salvar reflexao' : 'Registrar reflexao' }}</button>
          @if (editingId()) { <button class="btn-secondary" type="button" (click)="resetForm()">Cancelar</button> }
        </div>
      </form>

      <div class="space-y-3">
        @for (reflection of filteredReflections(); track reflection.id) {
          <article class="panel">
            <div class="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <p class="text-sm font-semibold text-teal-700 dark:text-teal-300">{{ reflection.date | date: 'dd/MM/yyyy' }}</p>
                <h3 class="mt-1 text-xl font-bold">{{ reflection.title || 'Reflexao sem titulo' }}</h3>
                @if (meetingTitle(reflection.meetingId); as title) {
                  <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">Associada a {{ title }}</p>
                }
              </div>
              <div class="flex gap-2">
                <button class="btn-secondary px-2.5" type="button" (click)="edit(reflection)" aria-label="Editar"><app-icon name="edit" /></button>
                <button class="btn-danger px-2.5" type="button" (click)="remove(reflection.id)" aria-label="Excluir"><app-icon name="trash" /></button>
              </div>
            </div>
            <p class="mt-4 whitespace-pre-wrap leading-7 text-stone-700 dark:text-stone-200">{{ reflection.content }}</p>
          </article>
        } @empty {
          <p class="panel text-stone-600 dark:text-stone-300">Nenhuma reflexao encontrada.</p>
        }
      </div>
    </section>
  `
})
export class Reflections {
  private readonly fb = inject(FormBuilder);
  readonly storage = inject(StorageService);
  readonly query = signal('');
  readonly editingId = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    title: [''],
    content: ['', [Validators.required, Validators.minLength(3)]],
    meetingId: ['']
  });

  readonly filteredReflections = computed(() => {
    const term = this.query().trim().toLowerCase();
    return this.storage.reflections().filter((reflection) =>
      !term || `${reflection.title ?? ''} ${reflection.content}`.toLowerCase().includes(term)
    );
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const draft = { ...value, meetingId: value.meetingId || undefined };
    const id = this.editingId();
    if (id) {
      this.storage.updateReflection(id, draft);
    } else {
      this.storage.addReflection(draft);
    }
    this.resetForm();
  }

  edit(reflection: Reflection): void {
    this.editingId.set(reflection.id);
    this.form.patchValue({ ...reflection, meetingId: reflection.meetingId ?? '' });
  }

  remove(id: string): void {
    if (confirm('Excluir esta reflexao?')) {
      this.storage.deleteReflection(id);
    }
  }

  meetingTitle(id?: string): string | undefined {
    return this.storage.meetings().find((meeting) => meeting.id === id)?.title;
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({ date: new Date().toISOString().slice(0, 10), title: '', content: '', meetingId: '' });
  }
}
