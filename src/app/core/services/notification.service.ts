import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from '../auth/auth.service';

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
  private readonly supabase = inject(SupabaseService);
  private readonly auth     = inject(AuthService);

  private readonly _notifications = signal<AppNotification[]>([]);

  readonly notifications = this._notifications.asReadonly();

  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.read).length
  );

  private checkInterval: any = null;

  constructor() {
    this.startSessionScanner();
  }

  startSessionScanner(): void {
    // Initial check
    this.scanUpcomingSessions();

    // Check periodically every 60 seconds
    if (!this.checkInterval && typeof window !== 'undefined') {
      this.checkInterval = setInterval(() => {
        this.scanUpcomingSessions();
      }, 60000);
    }
  }

  async scanUpcomingSessions(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user || !this.supabase.isConfigured()) return;

    try {
      const now = new Date();
      const thirtyMinsLater = new Date(now.getTime() + 45 * 60000);

      // Fetch scheduled sessions for classes belonging to this instructor
      const { data, error } = await this.supabase.client
        .from('sessions')
        .select(`
          id, title, session_number, status, scheduled_at, started_at,
          class:classes(name, instructor_id)
        `)
        .eq('status', 'scheduled')
        .not('scheduled_at', 'is', null);

      if (error || !data) return;

      const currentNotifIds = new Set(this._notifications().map(n => n.id));

      data.forEach((s: any) => {
        const instId = Array.isArray(s.class) ? s.class[0]?.instructor_id : s.class?.instructor_id;
        if (instId && instId !== user.id) return;

        const dateVal = s.scheduled_at || s.started_at;
        if (!dateVal) return;

        const sessTime = new Date(dateVal).getTime();
        const diffMins = Math.round((sessTime - now.getTime()) / 60000);

        // Notify if starting in [-10 min, +45 min]
        if (diffMins >= -10 && diffMins <= 45) {
          const notifId = `sess_${s.id}`;
          if (!currentNotifIds.has(notifId)) {
            const className = Array.isArray(s.class) ? s.class[0]?.name : s.class?.name;
            const timeDesc = diffMins <= 0 ? 'Starting now' : `in ${diffMins} min`;

            this.addNotification({
              title: `📅 Session #${s.session_number}: ${s.title}`,
              message: `Upcoming session for "${className || 'Class'}" is starting ${timeDesc}. Click to launch live workspace.`,
              type: 'system',
              link: `/instructor/sessions/${s.id}/live`,
            });
          }
        }
      });
    } catch (e: unknown) {
      console.warn('[NotificationService] scanUpcomingSessions warning:', e);
    }
  }

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

  addNotification(item: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { id?: string }): void {
    const newNotif: AppNotification = {
      ...item,
      id: item.id || `n_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: 'Just now',
      read: false,
    };
    this._notifications.update(items => [newNotif, ...items]);
  }

  clearAll(): void {
    this._notifications.set([]);
  }
}
