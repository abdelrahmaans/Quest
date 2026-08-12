import { Component, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';
import { IconComponent } from './icon/icon';

/**
 * Theme toggle button — shows sun (light) or moon (dark).
 * Place in any layout shell or header.
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [IconComponent],
  template: `
    <button
      type="button"
      class="theme-toggle"
      [attr.aria-label]="theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      [attr.title]="theme.isDark ? 'Light mode' : 'Dark mode'"
      (click)="theme.toggle()"
    >
      <app-icon [name]="theme.isDark ? 'sun' : 'moon'" [size]="18" />
    </button>
  `,
  styles: [`
    :host { display: inline-flex; }

    .theme-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md);
      border: 1.5px solid var(--clr-border);
      background: var(--clr-surface);
      color: var(--clr-text-muted);
      cursor: pointer;
      transition: all var(--t-fast);

      &:hover {
        color: var(--clr-primary);
        border-color: var(--clr-primary);
        background: color-mix(in srgb, var(--clr-primary) 8%, transparent);
      }
    }
  `],
})
export class ThemeToggleComponent {
  readonly theme = inject(ThemeService);
}
