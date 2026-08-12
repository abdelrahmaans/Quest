import { Injectable, signal, effect, computed } from '@angular/core';
import type { Lang } from './translations';
import { TRANSLATIONS } from './translations';

/**
 * TranslationService — simple AR/EN i18n without any external library.
 * Persists language preference in localStorage.
 * Automatically sets `dir` attribute on <html> for RTL/LTR support.
 *
 * Usage (in templates via pipe or direct call):
 *   {{ i18n.t('auth.login.title') }}
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly STORAGE_KEY = 'mq_lang';

  readonly lang = signal<Lang>(this.loadPreference());

  readonly isRtl = computed(() => this.lang() === 'ar');

  constructor() {
    this.apply(this.lang());

    effect(() => {
      const lang = this.lang();
      this.apply(lang);
      localStorage.setItem(this.STORAGE_KEY, lang);
    });
  }

  /** Translate a key, falling back to the key itself if not found. */
  t(key: string): string {
    return TRANSLATIONS[this.lang()][key] ?? TRANSLATIONS['en'][key] ?? key;
  }

  toggle(): void {
    this.lang.update(l => (l === 'en' ? 'ar' : 'en'));
  }

  set(lang: Lang): void {
    this.lang.set(lang);
  }

  private apply(lang: Lang): void {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  }

  private loadPreference(): Lang {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Lang | null;
    if (stored === 'en' || stored === 'ar') return stored;
    // Fallback: detect Arabic browser language
    return navigator.language.startsWith('ar') ? 'ar' : 'en';
  }
}
