import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { StatsService } from '../../core/services/stats.service';
import { StorageService } from '../../core/services/storage.service';

@Component({
  selector: 'app-statistics',
  imports: [DecimalPipe],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-300">Estatisticas</p>
        <h2 class="mt-1 text-3xl font-bold">Evolução simples e clara</h2>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article class="panel"><p class="text-sm text-stone-500">Total frequentado</p><strong class="mt-2 block text-3xl">{{ stats.attendedMeetings().length }}</strong></article>
        <article class="panel"><p class="text-sm text-stone-500">Frequência mensal</p><strong class="mt-2 block text-3xl">{{ stats.monthlyAttendance() }}</strong></article>
        <article class="panel"><p class="text-sm text-stone-500">Frequência anual</p><strong class="mt-2 block text-3xl">{{ stats.annualAttendance() }}</strong></article>
        <article class="panel"><p class="text-sm text-stone-500">Média semanal</p><strong class="mt-2 block text-3xl">{{ stats.weeklyAverage() | number: '1.0-1' }}</strong></article>
        <article class="panel"><p class="text-sm text-stone-500">Streak</p><strong class="mt-2 block text-3xl">{{ stats.currentStreak() }}</strong></article>
        <article class="panel"><p class="text-sm text-stone-500">Reflexões</p><strong class="mt-2 block text-3xl">{{ storage.reflections().length }}</strong></article>
        <article class="panel md:col-span-2"><p class="text-sm text-stone-500">Comparecimento</p><strong class="mt-2 block text-3xl">{{ stats.attendanceRate() }}%</strong></article>
      </div>

      <article class="panel">
        <h3 class="text-xl font-bold">Frequência por mês</h3>
        <div class="mt-5 flex h-64 items-end gap-2">
          @for (bar of stats.monthBuckets(); track bar.label) {
            <div class="flex flex-1 flex-col items-center gap-2">
              <div class="flex h-52 w-full items-end rounded-md bg-stone-100 p-1 dark:bg-stone-800">
                <div class="w-full rounded bg-teal-600 dark:bg-teal-400" [style.height.%]="barHeight(bar.value)"></div>
              </div>
              <span class="text-xs capitalize text-stone-500">{{ bar.label }}</span>
            </div>
          }
        </div>
      </article>

      <article class="panel">
        <div class="mb-4">
          <h3 class="text-xl font-bold">Calendário de atividade</h3>
          <p class="text-sm text-stone-500 dark:text-stone-400">Dias com presenca nos ultimos 112 dias.</p>
        </div>
        <div class="grid grid-cols-16 gap-1 overflow-x-auto pb-2" aria-label="Calendário de atividade">
          @for (day of stats.activityDays(); track day.date) {
            <span
              class="size-4 rounded-sm border border-stone-200 dark:border-stone-800"
              [class.bg-stone-100]="day.count === 0"
              [class.dark:bg-stone-800]="day.count === 0"
              [class.bg-teal-300]="day.count === 1"
              [class.bg-teal-500]="day.count === 2"
              [class.bg-teal-700]="day.count >= 3"
              [title]="day.date + ': ' + day.count + ' presenca(s)'"
            ></span>
          }
        </div>
      </article>
    </section>
  `
})
export class Statistics {
  readonly stats = inject(StatsService);
  readonly storage = inject(StorageService);

  barHeight(value: number): number {
    const max = Math.max(...this.stats.monthBuckets().map((bar) => bar.value), 1);
    return Math.max(6, (value / max) * 100);
  }
}
