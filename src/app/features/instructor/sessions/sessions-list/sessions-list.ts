import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, UpperCasePipe, CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { SessionService } from '../../../../core/services/session.service';
import { IconComponent } from '../../../../shared/ui/icon/icon';

interface ClassItem { id: string; name: string; }

export type GamificationModeId = 'xp_levels' | 'teams_duels' | 'badges_mastery' | 'hybrid_quest';

interface SessionRow {
  id: string;
  session_number: number;
  title: string;
  description: string | null;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  started_at: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  class_id: string;
  class_name: string;
  gamification_mode: GamificationModeId;
  created_at: string;
}

export interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  sessions: SessionRow[];
}

@Component({
  selector: 'app-sessions-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, UpperCasePipe, CommonModule, IconComponent],
  templateUrl: './sessions-list.html',
  styleUrl: './sessions-list.css',
})
export class SessionsListComponent implements OnInit {
  readonly auth           = inject(AuthService);
  readonly supabase       = inject(SupabaseService);
  readonly sessionService = inject(SessionService);
  readonly router         = inject(Router);

  readonly isLoading   = signal(true);
  readonly sessions    = signal<SessionRow[]>([]);
  readonly classes     = signal<ClassItem[]>([]);
  readonly activeTab   = signal<'all' | 'live' | 'scheduled' | 'completed'>('all');
  readonly viewMode    = signal<'list' | 'calendar'>('calendar'); // Default to calendar view as user requested!
  readonly showCreate  = signal(false);
  readonly isCreating  = signal(false);
  readonly error       = signal<string | null>(null);

  /* Calendar View State */
  currentCalendarDate = new Date();
  readonly calendarMonthYear = signal<string>('');
  readonly selectedDayModal  = signal<CalendarDay | null>(null);

  /* Form */
  selectedClassId          = '';
  sessionTitle             = '';
  sessionDesc              = '';
  scheduledDate            = '';
  durationMins             = 45;
  selectedGamificationMode: GamificationModeId = 'xp_levels';

  readonly gamificationModes = [
    { id: 'xp_levels'     as GamificationModeId, name: '⚡ XP & Level Progression', desc: 'Points, streaks, & rankings' },
    { id: 'teams_duels'   as GamificationModeId, name: '🛡️ Team Quests & Duels',    desc: 'Phoenix vs Titans battles' },
    { id: 'badges_mastery' as GamificationModeId, name: '🏆 Badges & Mastery',        desc: 'Special badges unlocking' },
    { id: 'hybrid_quest'  as GamificationModeId, name: '🎯 Custom Hybrid Quest',     desc: 'Full hybrid interactive mix' },
  ];

  /* ── Today's Sessions Agenda ── */
  readonly todaySessions = computed(() => {
    const today = new Date();
    const tYear = today.getFullYear();
    const tMonth = today.getMonth();
    const tDate = today.getDate();

    return this.sessions().filter(s => {
      const dateVal = s.scheduled_at || s.started_at;
      if (!dateVal) return false;
      const d = new Date(dateVal);
      return d.getFullYear() === tYear && d.getMonth() === tMonth && d.getDate() === tDate;
    });
  });

  /* ── Filtered Sessions for List View ── */
  get filteredSessions(): SessionRow[] {
    const tab = this.activeTab();
    if (tab === 'all') return this.sessions();
    return this.sessions().filter(s => s.status === tab);
  }

  /* ── Calendar Days Matrix with robust local date matching ── */
  readonly calendarDays = computed(() => {
    const all = this.sessions();
    const curr = this.currentCalendarDate;
    const year = curr.getFullYear();
    const month = curr.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const now = new Date();
    const isSameDate = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

    const getSessionsForDate = (targetDate: Date) => {
      return all.filter(s => {
        const rawDate = s.scheduled_at || s.started_at;
        if (!rawDate) return false;
        const sDate = new Date(rawDate);
        return isSameDate(sDate, targetDate);
      });
    };

    const days: CalendarDay[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      days.push({
        date: d,
        dateStr: d.toISOString(),
        dayNum: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: isSameDate(d, now),
        sessions: getSessionsForDate(d),
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dateStr: d.toISOString(),
        dayNum: i,
        isCurrentMonth: true,
        isToday: isSameDate(d, now),
        sessions: getSessionsForDate(d),
      });
    }

    // Next month padding to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateStr: d.toISOString(),
        dayNum: i,
        isCurrentMonth: false,
        isToday: isSameDate(d, now),
        sessions: getSessionsForDate(d),
      });
    }

    return days;
  });

  async ngOnInit(): Promise<void> {
    this.updateCalendarLabel();
    await Promise.all([this.loadClasses(), this.loadSessions()]);
    this.isLoading.set(false);
  }

  updateCalendarLabel(): void {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.calendarMonthYear.set(`${monthNames[this.currentCalendarDate.getMonth()]} ${this.currentCalendarDate.getFullYear()}`);
  }

  prevMonth(): void {
    this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() - 1, 1);
    this.updateCalendarLabel();
  }

  nextMonth(): void {
    this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() + 1, 1);
    this.updateCalendarLabel();
  }

  goToToday(): void {
    this.currentCalendarDate = new Date();
    this.updateCalendarLabel();
  }

  openDayModal(day: CalendarDay): void {
    this.selectedDayModal.set(day);
  }

  closeDayModal(): void {
    this.selectedDayModal.set(null);
  }

  async loadClasses(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;
    const { data } = await this.supabase.client
      .from('classes').select('id, name').eq('instructor_id', user.id).order('name');
    this.classes.set(data ?? []);
  }

  async loadSessions(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    try {
      const { data, error } = await this.supabase.client
        .from('sessions')
        .select(`
          id, session_number, title, description, status, scheduled_at, started_at, duration_minutes, class_id, gamification_mode, created_at,
          class:classes(name, instructor_id)
        `)
        .order('session_number', { ascending: true });

      if (error) throw error;

      const mapped: SessionRow[] = (data ?? [])
        .filter((s: any) => {
          const instId = Array.isArray(s.class) ? s.class[0]?.instructor_id : s.class?.instructor_id;
          return instId === user.id;
        })
        .map((s: any) => ({
          id:               s.id,
          session_number:   s.session_number,
          title:            s.title,
          description:      s.description,
          status:           s.status,
          scheduled_at:     s.scheduled_at,
          started_at:       s.started_at,
          duration_minutes: s.duration_minutes,
          class_id:         s.class_id,
          class_name:       Array.isArray(s.class) ? (s.class[0]?.name ?? '—') : (s.class as { name: string } | null)?.name ?? '—',
          gamification_mode: s.gamification_mode || 'xp_levels',
          created_at:       s.created_at,
        }));

      this.sessions.set(mapped);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    }
  }

  async createSession(): Promise<void> {
    if (!this.sessionTitle.trim() || !this.selectedClassId) return;
    this.isCreating.set(true);
    this.error.set(null);

    try {
      const { error } = await this.sessionService.createSession({
        classId:          this.selectedClassId,
        title:            this.sessionTitle,
        description:      this.sessionDesc,
        scheduledAt:      this.scheduledDate,
        durationMinutes:  this.durationMins,
        gamificationMode: this.selectedGamificationMode,
      });

      if (error) throw error;

      this.sessionTitle = '';
      this.sessionDesc = '';
      this.scheduledDate = '';
      this.showCreate.set(false);
      await this.loadSessions();
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.isCreating.set(false);
    }
  }

  async startLiveSession(session: SessionRow): Promise<void> {
    try {
      await this.sessionService.launchSession(session.id);
    } catch (e: unknown) {
      console.warn('launch live warning:', e);
    }
    await this.router.navigate(['/instructor/sessions', session.id, 'live']);
  }

  getModeName(mode: GamificationModeId): string {
    switch (mode) {
      case 'teams_duels':    return '🛡️ Team Duels';
      case 'badges_mastery': return '🏆 Badges';
      case 'hybrid_quest':   return '🎯 Hybrid';
      default:               return '⚡ XP & Levels';
    }
  }

  getStatusBadgeClass(status: SessionRow['status']): string {
    switch (status) {
      case 'live':      return 'badge--live';
      case 'scheduled': return 'badge--scheduled';
      case 'completed': return 'badge--completed';
      default:          return 'badge--draft';
    }
  }
}
