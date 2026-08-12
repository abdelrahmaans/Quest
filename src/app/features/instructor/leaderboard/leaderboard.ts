import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../../core/auth/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../../../shared/ui/icon/icon';

interface LeaderboardEntry {
  rank: number;
  id: string;
  full_name: string;
  xp_total: number;
  level: number;
  class_name: string;
  badge_count: number;
  streak: number;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [DecimalPipe, IconComponent],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css',
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  readonly auth     = inject(AuthService);
  readonly supabase = inject(SupabaseService);

  readonly isLoading        = signal(true);
  readonly entries          = signal<LeaderboardEntry[]>([]);
  readonly error            = signal<string | null>(null);
  readonly isRealtimeActive = signal<boolean>(false);

  private channel: RealtimeChannel | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadLeaderboard();
    this.setupRealtimeSubscription();
  }

  ngOnDestroy(): void {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
      this.channel = null;
      this.isRealtimeActive.set(false);
    }
  }

  private setupRealtimeSubscription(): void {
    if (!this.supabase.isConfigured()) return;

    try {
      this.channel = this.supabase.client
        .channel('instructor_leaderboard_realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'xp_events' },
          () => {
            // Re-fetch rankings in real time when new XP is awarded
            this.loadLeaderboard();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isRealtimeActive.set(true);
          }
        });
    } catch {
      // Fallback
    }
  }

  async loadLeaderboard(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    try {
      // Get all students for this instructor, ordered by XP
      const { data, error } = await this.supabase.client
        .from('students')
        .select(`
          id, full_name, xp_total, level, streak_days,
          class:classes(name)
        `)
        .eq('instructor_id', user.id)
        .order('xp_total', { ascending: false })
        .limit(50);

      if (error) throw error;

      const ranked: LeaderboardEntry[] = (data ?? []).map((s: {
        id: string; full_name: string; xp_total: number; level: number; streak_days: number;
        class: { name: string }[] | null;
      }, i: number) => ({
        rank:        i + 1,
        id:          s.id,
        full_name:   s.full_name,
        xp_total:    s.xp_total  ?? 0,
        level:       s.level      ?? 1,
        class_name:  Array.isArray(s.class) ? (s.class[0]?.name ?? '—') : (s.class as { name: string } | null)?.name ?? '—',
        badge_count: 0,
        streak:      s.streak_days ?? 0,
      }));

      this.entries.set(ranked);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.isLoading.set(false);
    }
  }

  getMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  }

  getXPBarWidth(xp: number): string {
    const max = this.entries()[0]?.xp_total ?? 1;
    return `${Math.min(100, (xp / max) * 100).toFixed(1)}%`;
  }
}
