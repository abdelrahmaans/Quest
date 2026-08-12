import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICON_PATHS, IconName } from './icons.constants';

/**
 * Reusable Lucide-based icon component.
 * Renders SVG inline from a static path dictionary — zero external dependencies.
 *
 * Usage:
 *   <app-icon name="mail" [size]="20" class="icon-muted" />
 *
 * Styling: use CSS `color` to control stroke color (stroke="currentColor").
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      [innerHTML]="safeContent()"
    ></svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    svg { display: block; }
  `],
})
export class IconComponent {
  private readonly sanitizer = inject(DomSanitizer);

  /** Icon name — must be a key of IconName. */
  name = input.required<IconName>();

  /** Size in px (applies to both width and height). Default: 20 */
  size = input<number>(20);

  safeContent = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(ICON_PATHS[this.name()] ?? ''),
  );
}
