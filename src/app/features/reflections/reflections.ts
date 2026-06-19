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

      @if (reflectionToDelete(); as reflection) {
        <div class="fixed inset-0 z-50 grid place-items-center bg-stone-950/60 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="delete-reflection-title">
          <div class="w-full max-w-lg rounded-lg border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900 dark:bg-stone-900">
            <div class="flex items-start gap-4">
              <div class="grid size-11 shrink-0 place-items-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200">
                <app-icon name="trash" />
              </div>
              <div>
                <h3 id="delete-reflection-title" class="text-xl font-bold">Excluir reflexão?</h3>
                <p class="mt-1 text-sm text-stone-600 dark:text-stone-300">Essa ação remove o registro do diário e não pode ser desfeita.</p>
              </div>
            </div>

            <dl class="mt-5 grid gap-3 rounded-md bg-red-50 p-4 text-sm text-red-950 dark:bg-red-950/40 dark:text-red-50">
              <div>
                <dt class="font-semibold text-red-700 dark:text-red-200">Data</dt>
                <dd class="mt-1 font-medium">{{ reflection.date | date: 'dd/MM/yyyy' }}</dd>
              </div>
              <div>
                <dt class="font-semibold text-red-700 dark:text-red-200">Título</dt>
                <dd class="mt-1 font-medium">{{ reflection.title || 'Reflexão sem título' }}</dd>
              </div>
              @if (meetingTitle(reflection.meetingId); as title) {
                <div>
                  <dt class="font-semibold text-red-700 dark:text-red-200">Reunião associada</dt>
                  <dd class="mt-1 font-medium">{{ title }}</dd>
                </div>
              }
              <div>
                <dt class="font-semibold text-red-700 dark:text-red-200">Texto</dt>
                <dd class="mt-1 max-h-28 overflow-hidden whitespace-pre-wrap">{{ reflection.content }}</dd>
              </div>
            </dl>

            <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" class="btn-secondary" (click)="cancelDelete()">Cancelar</button>
              <button type="button" class="btn-danger" (click)="confirmDelete()">
                <app-icon name="trash" /> Excluir reflexão
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `
})
export class Reflections {
  private readonly fb = inject(FormBuilder);
  readonly storage = inject(StorageService);
  readonly query = signal('');
  readonly editingId = signal<string | null>(null);
  readonly reflectionToDelete = signal<Reflection | null>(null);
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
    const reflection = this.storage.reflections().find((item) => item.id === id);
    if (reflection) {
      this.reflectionToDelete.set(reflection);
    }
  }

  confirmDelete(): void {
    const reflection = this.reflectionToDelete();
    if (!reflection) {
      return;
    }

    this.storage.deleteReflection(reflection.id);
    this.reflectionToDelete.set(null);
  }

  cancelDelete(): void {
    this.reflectionToDelete.set(null);
  }

  meetingTitle(id?: string): string | undefined {
    return this.storage.meetings().find((meeting) => meeting.id === id)?.title;
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({ date: new Date().toISOString().slice(0, 10), title: '', content: '', meetingId: '' });
  }
}
