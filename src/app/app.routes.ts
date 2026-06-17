import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard)
  },
  {
    path: 'agenda',
    loadComponent: () => import('./features/meetings/meetings').then((m) => m.Meetings)
  },
  {
    path: 'presencas',
    loadComponent: () => import('./features/attendance/attendance').then((m) => m.Attendance)
  },
  {
    path: 'reflexoes',
    loadComponent: () => import('./features/reflections/reflections').then((m) => m.Reflections)
  },
  {
    path: 'estatisticas',
    loadComponent: () => import('./features/statistics/statistics').then((m) => m.Statistics)
  },
  {
    path: 'configuracoes',
    loadComponent: () => import('./features/settings/settings').then((m) => m.Settings)
  },
  { path: '**', redirectTo: 'dashboard' }
];
