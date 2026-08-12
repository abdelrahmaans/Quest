import { Component, inject, signal, ElementRef, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';
import { I18nService } from '../../../core/services/i18n.service';
import { IconComponent } from '../icon/icon';
import type { IconName } from '../icon/icons.constants';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [RouterLink, IconComponent],
  templateUrl: './notification-dropdown.html',
  styleUrl: './notification-dropdown.css',
})
export class NotificationDropdownComponent {
  readonly notifService = inject(NotificationService);
  readonly i18n         = inject(I18nService);
  private readonly elementRef = inject(ElementRef);

  readonly isOpen = signal(false);
  readonly filter = signal<'all' | 'unread'>('all');

  toggleOpen(): void {
    this.isOpen.update(v => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  get filteredNotifications(): AppNotification[] {
    const list = this.notifService.notifications();
    return this.filter() === 'unread' ? list.filter(n => !n.read) : list;
  }

  getIconName(type: AppNotification['type']): IconName {
    switch (type) {
      case 'xp':        return 'zap';
      case 'badge':     return 'trophy';
      case 'level':     return 'sparkles';
      case 'challenge': return 'target';
      default:          return 'bell';
    }
  }

  onNotificationClick(n: AppNotification): void {
    this.notifService.markAsRead(n.id);
    this.close();
  }
}
