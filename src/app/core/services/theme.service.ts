import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

/**
 * ThemeService — manages light/dark mode.
 * Persists the user's preference to localStorage.
 * Applies the theme by setting `data-theme` on <html>.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'mq_theme';

  readonly current = signal<Theme>(this.loadPreference());

  constructor() {
    // Apply immediately on boot
    this.apply(this.current());

    // React to every change
    effect(() => {
      const theme = this.current();
      this.apply(theme);
      localStorage.setItem(this.STORAGE_KEY, theme);
    });
  }

  toggle(): void {
    this.current.update(t => (t === 'light' ? 'dark' : 'light'));
  }

  set(theme: Theme): void {
    this.current.set(theme);
  }

  get isDark(): boolean {
    return this.current() === 'dark';
  }

  private apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private loadPreference(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    // Fallback to OS preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
