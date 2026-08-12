import { Component, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

/**
 * Language toggle button — switches between AR and EN.
 * Displays the *opposite* language name as the label (what you'll switch to).
 */
@Component({
  selector: 'app-lang-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="lang-toggle"
      [attr.aria-label]="i18n.lang() === 'en' ? 'Switch to Arabic' : 'Switch to English'"
      (click)="i18n.toggle()"
    >
      <span class="lang-label">
        {{ i18n.lang() === 'en' ? 'العربية' : 'English' }}
      </span>
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }

    .lang-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 36px;
      padding: 0 .75rem;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--clr-border);
      background: var(--clr-surface);
      color: var(--clr-text-muted);
      cursor: pointer;
      font-family: inherit;
      font-size: .8125rem;
      font-weight: 600;
      transition: all var(--t-fast);

      &:hover {
        color: var(--clr-primary);
        border-color: var(--clr-primary);
        background: color-mix(in srgb, var(--clr-primary) 8%, transparent);
      }
    }

    .lang-label {
      font-family: var(--font-arabic);
      letter-spacing: 0;
    }
  `],
})
export class LangToggleComponent {
  readonly i18n = inject(I18nService);
}
