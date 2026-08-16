import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, UpperCasePipe } from '@angular/common';
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
  duration_minutes: number | null;
  class_id: string;
  class_name: string;
  gamification_mode: GamificationModeId;
  created_at: string;
}

@Component({
  selector: 'app-sessions-list',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, UpperCasePipe, IconComponent],
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
  readonly showCreate  = signal(false);
  readonly isCreating  = signal(false);
  readonly error       = signal<string | null>(null);

  /* Form */
  selectedClassId          = '';
  sessionTitle             = '';
  sessionDesc              = '';
  scheduledDate            = '';
  durationMins             = 45;
  selectedGamificationMode: GamificationModeId = 'xp_levels';

  readonly gamificationModes = [
    { id: 'xp_levels'     as GamificationModeId, name: '⚡ XP & Level Progression', desc: 'Classic points, levels, and individual streaks' },
    { id: 'teams_duels'   as GamificationModeId, name: '🛡️ Team Quests & Duels',    desc: 'Group challenges, team battles, and collaborative XP' },
    { id: 'badges_mastery' as GamificationModeId, name: '🏆 Badges & Mastery',        desc: 'Milestone achievements and target criteria unlocks' },
    { id: 'hybrid_quest'  as GamificationModeId, name: '🎯 Custom Hybrid Quest',     desc: 'Customizable mix of XP, badges, and live challenges' },
  ];

  get filteredSessions(): SessionRow[] {
    const tab = this.activeTab();
    if (tab === 'all') return this.sessions();
    return this.sessions().filter(s => s.status === tab);
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadClasses(), this.loadSessions()]);
    this.isLoading.set(false);
  }

  async loadClasses(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;
    const { data } = await this.supabase.client
      .from('classes')
      .select('id, name')
      .eq('instructor_id', user.id)
      .order('name');
    this.classes.set(data ?? []);
  }

  async loadSessions(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    try {
      const { data, error } = await this.supabase.client
        .from('sessions')
        .select(`
          id, session_number, title, description, status, started_at, duration_minutes, class_id, gamification_mode, created_at,
          class:classes(name, instructor_id)
        `)
        .order('created_at', { ascending: false });

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
      const { error } = await this.sessionService.launchSession(session.id);
      if (error) throw error;
      await this.router.navigate(['/instructor/sessions', session.id, 'live']);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    }
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
