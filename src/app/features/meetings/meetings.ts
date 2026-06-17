import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meeting } from '../../core/models/meeting.model';
import { StorageService } from '../../core/services/storage.service';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-meetings',
  imports: [ReactiveFormsModule, DatePipe, Icon],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="text-sm font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">Agenda</p>
          <h2 class="mt-1 text-3xl font-bold">Reuniões</h2>
        </div>
        <div class="flex flex-wrap gap-2">
          <input type="month" class="field max-w-48" [value]="month()" (input)="month.set($any($event.target).value)" aria-label="Filtrar por mes" />
          <select class="field max-w-44" [value]="view()" (change)="view.set($any($event.target).value)">
            <option value="list">Lista</option>
            <option value="calendar">Calendário</option>
          </select>
        </div>
      </div>

      <form class="panel grid gap-4 lg:grid-cols-12" [formGroup]="form" (ngSubmit)="save()">
        <label class="lg:col-span-3"><span class="label">Nome</span><input class="field" formControlName="title" /></label>
        <label class="lg:col-span-2"><span class="label">Data</span><input class="field" type="date" formControlName="date" /></label>
        <label class="lg:col-span-2"><span class="label">Horário</span><input class="field" type="time" formControlName="time" /></label>
        <label class="lg:col-span-3"><span class="label">Local</span><input class="field" formControlName="location" /></label>
        <label class="lg:col-span-12"><span class="label">Observações</span><textarea class="field min-h-24" formControlName="notes"></textarea></label>
        <div class="flex gap-2 lg:col-span-12">
          <button type="submit" class="btn-primary" [disabled]="form.invalid">
            <app-icon name="plus" /> {{ editingId() ? 'Salvar alterações' : 'Adicionar reunião' }}
          </button>
          @if (editingId()) {
            <button type="button" class="btn-secondary" (click)="resetForm()">Cancelar</button>
          }
        </div>
      </form>

      @if (view() === 'calendar') {
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          @for (meeting of filteredMeetings(); track meeting.id) {
            <article class="panel">
              <p class="text-sm font-semibold text-teal-700 dark:text-teal-300">{{ meeting.date | date: 'dd/MM' }} as {{ meeting.time }}</p>
              <h3 class="mt-2 font-bold">{{ meeting.title }}</h3>
              <p class="mt-1 text-sm text-stone-600 dark:text-stone-300">{{ meeting.location }}</p>
            </article>
          }
        </div>
      } @else {
        <div class="space-y-3">
          @for (meeting of filteredMeetings(); track meeting.id) {
            <article class="panel flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-lg font-bold">{{ meeting.title }}</h3>
                  @if (meeting.attended) {
                    <span class="rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-100">Concluida</span>
                  }
                </div>
                <p class="mt-1 text-sm text-stone-600 dark:text-stone-300">{{ meeting.date | date: 'dd/MM/yyyy' }} as {{ meeting.time }} - {{ meeting.location }}</p>
                @if (meeting.notes) { <p class="mt-2 text-sm">{{ meeting.notes }}</p> }
              </div>
              <div class="flex gap-2">
                <button class="btn-secondary px-2.5" type="button" (click)="edit(meeting)" aria-label="Editar"><app-icon name="edit" /></button>
                <button class="btn-danger px-2.5" type="button" (click)="remove(meeting.id)" aria-label="Excluir"><app-icon name="trash" /></button>
              </div>
            </article>
          } @empty {
            <p class="panel text-stone-600 dark:text-stone-300">Nenhuma reuniao encontrada para este filtro.</p>
          }
        </div>
      }
    </section>
  `
})
export class Meetings {
  private readonly fb = inject(FormBuilder);
  private readonly storage = inject(StorageService);

  readonly month = signal(new Date().toISOString().slice(0, 7));
  readonly view = signal<'list' | 'calendar'>('list');
  readonly editingId = signal<string | null>(null);
  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    time: ['19:30', Validators.required],
    location: ['', Validators.required],
    notes: ['']
  });

  readonly filteredMeetings = computed(() => this.storage.meetings().filter((meeting) => meeting.date.startsWith(this.month())));

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const id = this.editingId();
    if (id) {
      this.storage.updateMeeting(id, value);
    } else {
      this.storage.addMeeting(value);
    }
    this.resetForm();
  }

  edit(meeting: Meeting): void {
    this.editingId.set(meeting.id);
    this.form.patchValue(meeting);
  }

  remove(id: string): void {
    if (confirm('Excluir esta reuniao? Reflexoes associadas serao mantidas, mas sem vinculo.')) {
      this.storage.deleteMeeting(id);
    }
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({ title: '', date: new Date().toISOString().slice(0, 10), time: '19:30', location: '', notes: '' });
  }
}
