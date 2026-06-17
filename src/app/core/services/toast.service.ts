import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly messages = signal<ToastMessage[]>([]);

  show(text: string, kind: ToastKind = 'info'): void {
    const id = crypto.randomUUID();
    this.messages.update((items) => [...items, { id, kind, text }]);
    window.setTimeout(() => this.dismiss(id), 3600);
  }

  dismiss(id: string): void {
    this.messages.update((items) => items.filter((item) => item.id !== id));
  }
}
