import { Injectable, signal, computed } from '@angular/core';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'xp' | 'badge' | 'level' | 'challenge' | 'system';
  timestamp: string;
  read: boolean;
  link?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly _notifications = signal<AppNotification[]>([
    {
      id: 'n1',
      title: 'XP Bonus Awarded',
      message: 'Farida Amer earned +150 XP for winning the Loop Sprint Live Challenge!',
      type: 'xp',
      timestamp: '5m ago',
      read: false,
      link: '/instructor/sessions/s1/live',
    },
    {
      id: 'n2',
      title: 'New Badge Unlocked',
      message: 'Omar Khaled unlocked the Code Ninja Legendary Badge!',
      type: 'badge',
      timestamp: '25m ago',
      read: false,
      link: '/instructor/gamification',
    },
    {
      id: 'n3',
      title: 'Class Level Up',
      message: 'Web Development & UI Quest reached Level 4 overall progress!',
      type: 'level',
      timestamp: '1h ago',
      read: true,
      link: '/instructor/classes',
    },
    {
      id: 'n4',
      title: 'Live Challenge Started',
      message: 'Algorithmic Duel challenge is now active for 15 students.',
      type: 'challenge',
      timestamp: '2h ago',
      read: true,
      link: '/instructor/challenges',
    },
  ]);

  readonly notifications = this._notifications.asReadonly();

  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.read).length
  );

  markAsRead(id: string): void {
    this._notifications.update(items =>
      items.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }

  markAllAsRead(): void {
    this._notifications.update(items =>
      items.map(n => ({ ...n, read: true }))
    );
  }

  addNotification(item: Omit<AppNotification, 'id' | 'timestamp' | 'read'>): void {
    const newNotif: AppNotification = {
      ...item,
      id: `n_${Date.now()}`,
      timestamp: 'Just now',
      read: false,
    };
    this._notifications.update(items => [newNotif, ...items]);
  }

  clearAll(): void {
    this._notifications.set([]);
  }
}
