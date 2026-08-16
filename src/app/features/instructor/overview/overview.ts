import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../../../shared/ui/icon/icon';
import type { IconName } from '../../../shared/ui/icon/icons.constants';
import type { GamificationModeId } from '../sessions/sessions-list/sessions-list';

interface StatCard { icon: IconName; label: string; value: string | number; color: string; change?: string; }
interface RecentStudent { name: string; xp: number; level: number; badge?: string; }

interface ScheduledSessionItem {
  id: string;
  title: string;
  session_number: number;
  class_name: string;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  started_at: string | null;
  duration_minutes: number | null;
  gamification_mode: GamificationModeId;
  created_at: string;
}

@Component({
  selector: 'app-instructor-overview',
  standalone: true,
  imports: [RouterLink, DatePipe, IconComponent],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class InstructorOverviewComponent implements OnInit {
  readonly auth      = inject(AuthService);
  readonly supabase  = inject(SupabaseService);
  readonly router    = inject(Router);

  readonly isLoading        = signal(true);
  readonly totalStudents    = signal(0);
  readonly totalClasses     = signal(0);
  readonly totalXP          = signal(0);
  readonly activeSessions   = signal(0);

  readonly recentStudents   = signal<RecentStudent[]>([]);
  readonly upcomingSessions = signal<ScheduledSessionItem[]>([]);

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  readonly stats = () => [
    { icon: 'user'           as IconName, label: 'Total Students',   value: this.totalStudents(),  color: '#0D9488', change: 'Enrolled' },
    { icon: 'graduation-cap' as IconName, label: 'Active Classes',   value: this.totalClasses(),   color: '#8B5CF6', change: 'Running' },
    { icon: 'zap'            as IconName, label: 'XP Distributed',   value: this.totalXP().toLocaleString(), color: '#F59E0B', change: 'All-time XP' },
    { icon: 'target'         as IconName, label: 'Live / Scheduled', value: this.activeSessions(), color: '#EF4444', change: 'Active sessions' },
  ];

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    try {
      // 1. Load class count
      const { count: classCount } = await this.supabase.client
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('instructor_id', user.id);

      this.totalClasses.set(classCount ?? 0);

      // 2. Load students count
      const { count: studentCount } = await this.supabase.client
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('instructor_id', user.id);

      this.totalStudents.set(studentCount ?? 0);

      // 3. Load total XP given across all students of this instructor
      const { data: xpStudentData } = await this.supabase.client
        .from('students')
        .select('xp_total')
        .eq('instructor_id', user.id);

      const total = (xpStudentData ?? []).reduce((sum, r) => sum + (r.xp_total ?? 0), 0);
      this.totalXP.set(total);

      // 4. Load Recent students (top by XP)
      const { data: topStudents } = await this.supabase.client
        .from('students')
        .select('id, full_name, xp_total, level')
        .eq('instructor_id', user.id)
        .order('xp_total', { ascending: false })
        .limit(5);

      this.recentStudents.set(
        (topStudents ?? []).map(s => ({
          name:  s.full_name ?? 'Student',
          xp:    s.xp_total  ?? 0,
          level: s.level      ?? 1,
        })),
      );

      // 5. Load Scheduled & Active Sessions for Instructor's Classes
      const { data: sessionData } = await this.supabase.client
        .from('sessions')
        .select(`
          id, title, session_number, status, started_at, duration_minutes, gamification_mode, created_at,
          class:classes(name, instructor_id)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      const filteredSessions: ScheduledSessionItem[] = (sessionData ?? [])
        .filter((s: any) => {
          const instId = Array.isArray(s.class) ? s.class[0]?.instructor_id : s.class?.instructor_id;
          return instId === user.id;
        })
        .map((s: any) => ({
          id:                s.id,
          title:             s.title,
          session_number:    s.session_number,
          class_name:        Array.isArray(s.class) ? (s.class[0]?.name ?? 'Class') : (s.class?.name ?? 'Class'),
          status:            s.status,
          started_at:        s.started_at,
          duration_minutes:  s.duration_minutes,
          gamification_mode: s.gamification_mode || 'xp_levels',
          created_at:        s.created_at,
        }));

      this.upcomingSessions.set(filteredSessions);

      const liveOrScheduledCount = filteredSessions.filter(s => s.status === 'live' || s.status === 'scheduled').length;
      this.activeSessions.set(liveOrScheduledCount);

    } catch (e) {
      console.warn('Overview data loading note:', e);
    } finally {
      this.isLoading.set(false);
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

  async launchLive(sess: ScheduledSessionItem): Promise<void> {
    try {
      await this.supabase.client
        .from('sessions')
        .update({ status: 'live' })
        .eq('id', sess.id);

      await this.router.navigate(['/instructor/sessions', sess.id, 'live']);
    } catch (e) {
      console.error(e);
    }
  }
}
