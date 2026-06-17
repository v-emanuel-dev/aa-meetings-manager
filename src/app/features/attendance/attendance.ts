import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StatsService } from '../../core/services/stats.service';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-attendance',
  imports: [FormsModule, DatePipe],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">Presencas</p>
        <h2 class="mt-1 text-3xl font-bold">Historico e controle</h2>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <article class="panel"><p class="text-sm text-stone-500">Presencas</p><strong class="mt-2 block text-3xl">{{ stats.attendedMeetings().length }}</strong></article>
        <article class="panel"><p class="text-sm text-stone-500">Ausencias</p><strong class="mt-2 block text-3xl">{{ stats.absentMeetings().length }}</strong></article>
        <article class="panel"><p class="text-sm text-stone-500">Comparecimento</p><strong class="mt-2 block text-3xl">{{ stats.attendanceRate() }}%</strong></article>
      </div>

      <div class="space-y-3">
        @for (meeting of meetings(); track meeting.id) {
          <article class="panel grid gap-4 lg:grid-cols-[1fr_10rem_10rem] lg:items-start">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-bold">{{ meeting.title }}</h3>
                @if (meeting.attended) {
                  <span class="rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-100">Presente</span>
                } @else if (isPast(meeting.date)) {
                  <span class="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 dark:bg-red-950 dark:text-red-100">Ausente</span>
                }
              </div>
              <p class="mt-1 text-sm text-stone-600 dark:text-stone-300">{{ meeting.date | date: 'dd/MM/yyyy' }} as {{ meeting.time }} - {{ meeting.location }}</p>
              <label class="mt-3 block">
                <span class="label">Nota rapida</span>
                <textarea class="field min-h-20" [ngModel]="meeting.experienceNote" (ngModelChange)="storage.updateMeeting(meeting.id, { experienceNote: $event })"></textarea>
              </label>
            </div>
            <label>
              <span class="label">Chegada real</span>
              <input class="field" type="time" [ngModel]="meeting.arrivalTime" (ngModelChange)="storage.updateMeeting(meeting.id, { arrivalTime: $event })" />
            </label>
            <label class="flex items-center gap-3 rounded-md border border-stone-200 p-3 dark:border-stone-800">
              <input class="size-5 accent-teal-700" type="checkbox" [ngModel]="meeting.attended" (ngModelChange)="storage.updateMeeting(meeting.id, { attended: $event })" />
              <span class="text-sm font-semibold">Compareci</span>
            </label>
          </article>
        }
      </div>
    </section>
  `
})
export class Attendance {
  readonly storage = inject(StorageService);
  readonly stats = inject(StatsService);
  readonly meetings = computed(() => [...this.storage.meetings()].reverse());

  isPast(date: string): boolean {
    return new Date(`${date}T23:59:59`) < new Date();
  }
}
