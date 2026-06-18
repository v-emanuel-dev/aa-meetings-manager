import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { AppData, ThemePreference } from '../models/app-data.model';
import { Meeting, MeetingDraft } from '../models/meeting.model';
import { Reflection } from '../models/reflection.model';
import { FirebaseDataService } from './firebase-data.service';
import { ToastService } from './toast.service';

const STORAGE_KEY = 'aa-meetings-manager:data:v1';

const today = new Date();
const iso = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return iso(date);
};

const initialData: AppData = {
  theme: 'light',
  meetings: [
    {
      id: 'seed-1',
      title: 'Grupo Serenidade',
      date: addDays(-10),
      time: '19:30',
      location: 'Sala comunitaria central',
      notes: 'Reuniao de partilha aberta.',
      attended: true,
      arrivalTime: '19:25',
      experienceNote: 'Sai com mais calma e clareza.'
    },
    {
      id: 'seed-2',
      title: 'Passos em Foco',
      date: addDays(-3),
      time: '20:00',
      location: 'Centro de apoio do bairro',
      attended: true,
      arrivalTime: '19:58'
    },
    {
      id: 'seed-3',
      title: 'Recomeço de Hoje',
      date: addDays(2),
      time: '18:30',
      location: 'Igreja Sao Jose, sala 2',
      notes: 'Levar caderno.',
      attended: false
    }
  ],
  reflections: [
    {
      id: 'reflection-seed-1',
      date: addDays(-3),
      title: 'Um dia de cada vez',
      content: 'Hoje percebi que chegar e ouvir ja foi uma forma de cuidado comigo mesmo.',
      meetingId: 'seed-2'
    }
  ]
};

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly toast = inject(ToastService);
  private readonly document = inject(DOCUMENT);
  private readonly firebase = inject(FirebaseDataService);
  private readonly data = signal<AppData>(this.load());
  private readonly cloudReady = signal(false);

  readonly meetings = computed(() =>
    [...this.data().meetings].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
  );
  readonly reflections = computed(() =>
    [...this.data().reflections].sort((a, b) => b.date.localeCompare(a.date))
  );
  readonly theme = computed(() => this.data().theme);
  readonly syncStatus = this.firebase.syncStatus;

  constructor() {
    void this.restoreCloudData();

    effect(() => {
      const data = this.data();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.document.documentElement.classList.toggle('dark', data.theme === 'dark');
    });

    effect(() => {
      const data = this.data();
      if (this.cloudReady() && this.firebase.enabled()) {
        void this.firebase.saveData(data);
      }
    });
  }

  addMeeting(draft: MeetingDraft): void {
    const meeting: Meeting = { id: crypto.randomUUID(), attended: false, ...draft };
    this.data.update((data) => ({ ...data, meetings: [...data.meetings, meeting] }));
    this.toast.show('Reuniao adicionada.', 'success');
  }

  updateMeeting(id: string, patch: Partial<Meeting>): void {
    this.data.update((data) => ({
      ...data,
      meetings: data.meetings.map((meeting) => (meeting.id === id ? { ...meeting, ...patch } : meeting))
    }));
    this.toast.show('Reuniao atualizada.', 'success');
  }

  deleteMeeting(id: string): void {
    this.data.update((data) => ({
      ...data,
      meetings: data.meetings.filter((meeting) => meeting.id !== id),
      reflections: data.reflections.map((reflection) =>
        reflection.meetingId === id ? { ...reflection, meetingId: undefined } : reflection
      )
    }));
    this.toast.show('Reuniao excluida.', 'success');
  }

  addReflection(draft: Omit<Reflection, 'id'>): void {
    this.data.update((data) => ({
      ...data,
      reflections: [{ id: crypto.randomUUID(), ...draft }, ...data.reflections]
    }));
    this.toast.show('Reflexao registrada.', 'success');
  }

  updateReflection(id: string, patch: Partial<Reflection>): void {
    this.data.update((data) => ({
      ...data,
      reflections: data.reflections.map((reflection) => (reflection.id === id ? { ...reflection, ...patch } : reflection))
    }));
    this.toast.show('Reflexao atualizada.', 'success');
  }

  deleteReflection(id: string): void {
    this.data.update((data) => ({
      ...data,
      reflections: data.reflections.filter((reflection) => reflection.id !== id)
    }));
    this.toast.show('Reflexao excluida.', 'success');
  }

  setTheme(theme: ThemePreference): void {
    this.data.update((data) => ({ ...data, theme }));
    this.toast.show(theme === 'dark' ? 'Tema escuro ativado.' : 'Tema claro ativado.', 'success');
  }

  exportData(): string {
    return JSON.stringify(this.data(), null, 2);
  }

  importData(json: string): boolean {
    try {
      const parsed = JSON.parse(json) as AppData;
      if (!Array.isArray(parsed.meetings) || !Array.isArray(parsed.reflections)) {
        throw new Error('Invalid data');
      }
      this.data.set({ meetings: parsed.meetings, reflections: parsed.reflections, theme: parsed.theme ?? 'light' });
      this.toast.show('Dados importados com sucesso.', 'success');
      return true;
    } catch {
      this.toast.show('Nao foi possivel importar o arquivo JSON.', 'error');
      return false;
    }
  }

  clearAll(): void {
    this.data.set({ meetings: [], reflections: [], theme: this.theme() });
    this.toast.show('Todos os dados foram removidos.', 'success');
  }

  private load(): AppData {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return initialData;
    }

    try {
      return JSON.parse(saved) as AppData;
    } catch {
      return initialData;
    }
  }

  private async restoreCloudData(): Promise<void> {
    if (!this.firebase.enabled()) {
      this.cloudReady.set(true);
      return;
    }

    const cloudData = await this.firebase.loadData();
    if (cloudData) {
      this.data.set(cloudData);
      this.toast.show('Dados carregados do Firebase.', 'success');
    } else {
      await this.firebase.saveData(this.data());
      this.toast.show('Firebase conectado. Dados locais enviados.', 'success');
    }
    this.cloudReady.set(true);
  }
}
