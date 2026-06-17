import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { StorageService } from './core/services/storage.service';
import { ToastService } from './core/services/toast.service';
import { Icon, IconName } from './shared/components/icon/icon';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly storage = inject(StorageService);
  readonly toast = inject(ToastService);
  readonly menuOpen = signal(false);
  readonly themeIcon = computed<IconName>(() => (this.storage.theme() === 'dark' ? 'sun' : 'moon'));

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: 'home' },
    { label: 'Agenda', path: '/agenda', icon: 'calendar' },
    { label: 'Presenças', path: '/presencas', icon: 'check' },
    { label: 'Reflexões', path: '/reflexoes', icon: 'book' },
    { label: 'Estatísticas', path: '/estatisticas', icon: 'chart' },
    { label: 'Configurações', path: '/configuracoes', icon: 'settings' }
  ];

  toggleTheme(): void {
    this.storage.setTheme(this.storage.theme() === 'dark' ? 'light' : 'dark');
  }
}
