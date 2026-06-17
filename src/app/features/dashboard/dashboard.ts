import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StatsService } from '../../core/services/stats.service';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, RouterLink],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">Dashboard</p>
        <h2 class="mt-1 text-3xl font-bold">Seu acompanhamento de reuniões</h2>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        @for (card of cards(); track card.label) {
          <article class="panel">
            <p class="text-sm text-stone-500 dark:text-stone-400">{{ card.label }}</p>
            <strong class="mt-2 block text-3xl">{{ card.value }}</strong>
            <span class="mt-2 block text-sm text-stone-600 dark:text-stone-300">{{ card.detail }}</span>
          </article>
        }
      </div>

      <div class="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <article class="panel">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-stone-500 dark:text-stone-400">Próxima reunião</p>
              @if (nextMeeting(); as meeting) {
                <h3 class="mt-2 text-2xl font-bold">{{ meeting.title }}</h3>
                <p class="mt-2 text-stone-600 dark:text-stone-300">
                  {{ meeting.date | date: 'dd/MM/yyyy' }} as {{ meeting.time }} - {{ meeting.location }}
                </p>
                @if (meeting.notes) {
                  <p class="mt-4 rounded-md bg-stone-100 p-3 text-sm dark:bg-stone-800">{{ meeting.notes }}</p>
                }
              } @else {
                <h3 class="mt-2 text-2xl font-bold">Nada agendado</h3>
                <p class="mt-2 text-stone-600 dark:text-stone-300">Cadastre sua próxima reunião para acompanhar sua rotina.</p>
              }
            </div>
            <a routerLink="/agenda" class="btn-secondary shrink-0">Agenda</a>
          </div>
        </article>

        <article class="panel">
          <div class="mb-5 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-stone-500 dark:text-stone-400">Presenças por semana</p>
              <h3 class="text-xl font-bold">Últimas 8 semanas</h3>
            </div>
          </div>
          <div class="flex h-56 items-end gap-3">
            @for (bar of stats.weekBuckets(); track bar.label) {
              <div class="flex flex-1 flex-col items-center gap-2">
                <div class="flex h-44 w-full items-end rounded-md bg-stone-100 p-1 dark:bg-stone-800">
                  <div
                    class="w-full rounded bg-teal-600 dark:bg-teal-400"
                    [style.height.%]="barHeight(bar.value)"
                    [attr.aria-label]="bar.value + ' presenças'"
                  ></div>
                </div>
                <span class="text-xs text-stone-500">{{ bar.label }}</span>
              </div>
            }
          </div>
        </article>
      </div>
    </section>
  `
})
export class Dashboard {
  readonly storage = inject(StorageService);
  readonly stats = inject(StatsService);

  readonly nextMeeting = computed(() => {
    const now = new Date().toISOString().slice(0, 10);
    return this.storage.meetings().find((meeting) => meeting.date >= now);
  });

  readonly cards = computed(() => [
    { label: 'No mês', value: this.stats.monthlyAttendance(), detail: 'reuniões frequentadas' },
    { label: 'Sequência atual', value: this.stats.currentStreak(), detail: 'dias com presença' },
    { label: 'Reflexões', value: this.storage.reflections().length, detail: 'registros pessoais' },
    { label: 'Comparecimento', value: `${this.stats.attendanceRate()}%`, detail: 'em reuniões concluídas' }
  ]);

  barHeight(value: number): number {
    const max = Math.max(...this.stats.weekBuckets().map((bar) => bar.value), 1);
    return Math.max(8, (value / max) * 100);
  }
}
