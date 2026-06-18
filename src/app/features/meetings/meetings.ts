import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meeting, MeetingDraft } from '../../core/models/meeting.model';
import { StorageService } from '../../core/services/storage.service';
import { ToastService } from '../../core/services/toast.service';
import { Icon } from '../../shared/components/icon/icon';

type RequiredMeetingField = 'title' | 'date' | 'time' | 'location';

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
        <label class="lg:col-span-3">
          <span class="label">Nome</span>
          <input class="field" [class.border-red-500]="isInvalid('title')" [attr.aria-invalid]="isInvalid('title')" formControlName="title" />
          @if (isInvalid('title')) { <p class="mt-1 text-sm font-medium text-red-600 dark:text-red-300">Informe o nome da reunião.</p> }
        </label>
        <label class="lg:col-span-2">
          <span class="label">Data</span>
          <input class="field" [class.border-red-500]="isInvalid('date')" [attr.aria-invalid]="isInvalid('date')" type="date" formControlName="date" />
          @if (isInvalid('date')) { <p class="mt-1 text-sm font-medium text-red-600 dark:text-red-300">Informe a data.</p> }
        </label>
        <label class="lg:col-span-2">
          <span class="label">Horário</span>
          <input class="field" [class.border-red-500]="isInvalid('time')" [attr.aria-invalid]="isInvalid('time')" type="time" formControlName="time" />
          @if (isInvalid('time')) { <p class="mt-1 text-sm font-medium text-red-600 dark:text-red-300">Informe o horário.</p> }
        </label>
        <label class="lg:col-span-3">
          <span class="label">Local</span>
          <input class="field" [class.border-red-500]="isInvalid('location')" [attr.aria-invalid]="isInvalid('location')" formControlName="location" />
          @if (isInvalid('location')) { <p class="mt-1 text-sm font-medium text-red-600 dark:text-red-300">Informe o local.</p> }
        </label>
        <label class="lg:col-span-12"><span class="label">Observações</span><textarea class="field min-h-24" formControlName="notes"></textarea></label>
        <div class="flex gap-2 lg:col-span-12">
          <button type="submit" class="btn-primary">
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

      @if (pendingMeeting(); as meeting) {
        <div class="fixed inset-0 z-50 grid place-items-center bg-stone-950/60 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="confirm-meeting-title">
          <div class="w-full max-w-lg rounded-lg border border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-900">
            <div class="flex items-start gap-4">
              <div class="grid size-11 shrink-0 place-items-center rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-100">
                <app-icon name="calendar" />
              </div>
              <div>
                <h3 id="confirm-meeting-title" class="text-xl font-bold">Confirmar reunião</h3>
                <p class="mt-1 text-sm text-stone-600 dark:text-stone-300">Revise os dados antes de incluir na sua agenda.</p>
              </div>
            </div>

            <dl class="mt-5 grid gap-3 rounded-md bg-stone-100 p-4 text-sm dark:bg-stone-800">
              <div>
                <dt class="font-semibold text-stone-500 dark:text-stone-400">Nome</dt>
                <dd class="mt-1 font-medium">{{ meeting.title }}</dd>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt class="font-semibold text-stone-500 dark:text-stone-400">Data</dt>
                  <dd class="mt-1 font-medium">{{ meeting.date | date: 'dd/MM/yyyy' }}</dd>
                </div>
                <div>
                  <dt class="font-semibold text-stone-500 dark:text-stone-400">Horário</dt>
                  <dd class="mt-1 font-medium">{{ meeting.time }}</dd>
                </div>
              </div>
              <div>
                <dt class="font-semibold text-stone-500 dark:text-stone-400">Local</dt>
                <dd class="mt-1 font-medium">{{ meeting.location }}</dd>
              </div>
              @if (meeting.notes) {
                <div>
                  <dt class="font-semibold text-stone-500 dark:text-stone-400">Observações</dt>
                  <dd class="mt-1 whitespace-pre-wrap">{{ meeting.notes }}</dd>
                </div>
              }
            </dl>

            <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" class="btn-secondary" (click)="cancelAdd()">Cancelar</button>
              <button type="button" class="btn-primary" (click)="confirmAdd()">
                <app-icon name="check" /> Confirmar inclusão
              </button>
            </div>
          </div>
        </div>
      }

      @if (meetingToDelete(); as meeting) {
        <div class="fixed inset-0 z-50 grid place-items-center bg-stone-950/60 px-4 py-6" role="dialog" aria-modal="true" aria-labelledby="delete-meeting-title">
          <div class="w-full max-w-lg rounded-lg border border-red-200 bg-white p-6 shadow-2xl dark:border-red-900 dark:bg-stone-900">
            <div class="flex items-start gap-4">
              <div class="grid size-11 shrink-0 place-items-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200">
                <app-icon name="trash" />
              </div>
              <div>
                <h3 id="delete-meeting-title" class="text-xl font-bold">Excluir reunião?</h3>
                <p class="mt-1 text-sm text-stone-600 dark:text-stone-300">Essa ação remove a reunião da agenda. Reflexões associadas serão mantidas, mas sem vínculo.</p>
              </div>
            </div>

            <dl class="mt-5 grid gap-3 rounded-md bg-red-50 p-4 text-sm text-red-950 dark:bg-red-950/40 dark:text-red-50">
              <div>
                <dt class="font-semibold text-red-700 dark:text-red-200">Nome</dt>
                <dd class="mt-1 font-medium">{{ meeting.title }}</dd>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt class="font-semibold text-red-700 dark:text-red-200">Data</dt>
                  <dd class="mt-1 font-medium">{{ meeting.date | date: 'dd/MM/yyyy' }}</dd>
                </div>
                <div>
                  <dt class="font-semibold text-red-700 dark:text-red-200">Horário</dt>
                  <dd class="mt-1 font-medium">{{ meeting.time }}</dd>
                </div>
              </div>
              <div>
                <dt class="font-semibold text-red-700 dark:text-red-200">Local</dt>
                <dd class="mt-1 font-medium">{{ meeting.location }}</dd>
              </div>
            </dl>

            <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" class="btn-secondary" (click)="cancelDelete()">Cancelar</button>
              <button type="button" class="btn-danger" (click)="confirmDelete()">
                <app-icon name="trash" /> Excluir reunião
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `
})
export class Meetings {
  private readonly fb = inject(FormBuilder);
  private readonly storage = inject(StorageService);
  private readonly toast = inject(ToastService);

  readonly month = signal(new Date().toISOString().slice(0, 7));
  readonly view = signal<'list' | 'calendar'>('list');
  readonly editingId = signal<string | null>(null);
  readonly pendingMeeting = signal<MeetingDraft | null>(null);
  readonly meetingToDelete = signal<Meeting | null>(null);
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
      this.toast.show('Preencha os campos obrigatórios para incluir a reunião.', 'error');
      return;
    }
    const value = this.form.getRawValue();
    const id = this.editingId();
    if (id) {
      this.storage.updateMeeting(id, value);
    } else {
      this.pendingMeeting.set(value);
      return;
    }
    this.resetForm();
  }

  confirmAdd(): void {
    const meeting = this.pendingMeeting();
    if (!meeting) {
      return;
    }

    this.storage.addMeeting(meeting);
    this.pendingMeeting.set(null);
    this.resetForm();
  }

  cancelAdd(): void {
    this.pendingMeeting.set(null);
  }

  isInvalid(controlName: RequiredMeetingField): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  edit(meeting: Meeting): void {
    this.editingId.set(meeting.id);
    this.form.patchValue(meeting);
  }

  remove(id: string): void {
    const meeting = this.storage.meetings().find((item) => item.id === id);
    if (meeting) {
      this.meetingToDelete.set(meeting);
    }
  }

  confirmDelete(): void {
    const meeting = this.meetingToDelete();
    if (!meeting) {
      return;
    }

    this.storage.deleteMeeting(meeting.id);
    this.meetingToDelete.set(null);
  }

  cancelDelete(): void {
    this.meetingToDelete.set(null);
  }

  resetForm(): void {
    this.editingId.set(null);
    this.form.reset({ title: '', date: new Date().toISOString().slice(0, 10), time: '19:30', location: '', notes: '' });
  }
}
