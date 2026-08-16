import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, CommonModule } from '@angular/common';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../../../core/auth/auth.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { XpService } from '../../../../core/services/xp.service';
import { SessionService } from '../../../../core/services/session.service';
import { IconComponent } from '../../../../shared/ui/icon/icon';
import { AiAssistantDrawerComponent } from '../../../../shared/ui/ai-assistant-drawer/ai-assistant-drawer';

interface LiveStudent {
  id: string;
  full_name: string;
  xp_total: number;
  level: number;
  attendance: 'present' | 'absent' | 'late';
  selected: boolean;
  earnedSessionXp?: number;
}

interface LiveFeedEvent {
  id: string;
  studentName: string;
  points: number;
  reason: string;
  timestamp: string;
}

interface BadgePreset {
  key: string;
  name: string;
  icon: string;
  xp: number;
}

@Component({
  selector: 'app-live-workspace',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe, CommonModule, IconComponent, AiAssistantDrawerComponent],
  templateUrl: './live-workspace.html',
  styleUrl: './live-workspace.css',
})
export class LiveWorkspaceComponent implements OnInit, OnDestroy {
  readonly auth           = inject(AuthService);
  readonly supabase       = inject(SupabaseService);
  readonly xpService      = inject(XpService);
  readonly sessionService = inject(SessionService);
  readonly route          = inject(ActivatedRoute);
  readonly router         = inject(Router);

  /* AI Assistant State */
  readonly isAiDrawerOpen = signal<boolean>(false);

  readonly isLoading        = signal(true);
  readonly isEnding         = signal(false);
  readonly isAwarding       = signal(false);
  readonly sessionId        = signal<string>('');
  readonly sessionTitle     = signal<string>('Live Session Workspace');
  readonly className        = signal<string>('');
  readonly classId          = signal<string>('');
  readonly gamificationMode = signal<string>('xp_levels');

  /* Session Stats */
  readonly students       = signal<LiveStudent[]>([]);
  readonly feed           = signal<LiveFeedEvent[]>([]);
  readonly totalSessionXP = signal<number>(0);

  /* Live In-Session Leaderboard Modal */
  readonly showLiveLeaderboard = signal(false);
  get sortedLiveLeaderboard(): LiveStudent[] {
    return [...this.students()].sort((a, b) => b.xp_total - a.xp_total);
  }

  /* In-Session Custom Alarm / Challenge Timer with Sound */
  readonly showAlarmWidget = signal(false);
  readonly alarmSeconds    = signal<number>(300); // 5 min default
  readonly isAlarmRunning  = signal(false);
  readonly isAlarmRinging  = signal(false);
  private alarmInterval: any = null;

  /* Team Battle State (for teams_duels mode) */
  readonly activeTeamTab  = signal<'all' | 'red' | 'blue'>('all');
  get teamRedStudents(): LiveStudent[] {
    return this.students().filter((_, i) => i % 2 === 0);
  }
  get teamBlueStudents(): LiveStudent[] {
    return this.students().filter((_, i) => i % 2 === 1);
  }
  get teamRedScore(): number {
    return this.teamRedStudents.reduce((acc, s) => acc + s.xp_total, 0);
  }
  get teamBlueScore(): number {
    return this.teamBlueStudents.reduce((acc, s) => acc + s.xp_total, 0);
  }

  /* Badges Preset (for badges_mastery and hybrid_quest) */
  readonly badgePresets: BadgePreset[] = [
    { key: 'code_ninja',     name: 'Code Ninja',        icon: '🥷', xp: 30 },
    { key: 'team_champion',  name: 'Team Champion',     icon: '🛡️', xp: 25 },
    { key: 'speed_demon',    name: 'Speed Demon',       icon: '⚡', xp: 20 },
    { key: 'bug_hunter',     name: 'Bug Hunter',        icon: '🐛', xp: 35 },
    { key: 'creative_star',  name: 'Creative Spark',    icon: '💡', xp: 25 },
  ];

  /* Summary Modal */
  readonly showSummaryModal = signal(false);
  mvpStudentName = '—';

  /* Realtime */
  private channel: RealtimeChannel | null = null;
  readonly isRealtimeActive = signal<boolean>(false);

  /* Live XP Award Form */
  selectedXPPreset = 10;
  customXP         = '';
  useCustomXP      = false;
  awardReason      = 'Active Participation';
  customReason     = '';

  readonly xpPresets = [
    { label: '+5',   val: 5,   icon: '⭐' },
    { label: '+10',  val: 10,  icon: '⚡' },
    { label: '+25',  val: 25,  icon: '🔥' },
    { label: '+50',  val: 50,  icon: '💎' },
  ];

  readonly reasonOptions = [
    'Active Participation', 'Quick Response', 'Correct Answer',
    'Great Collaboration', 'Live Challenge Winner', 'Custom…',
  ];

  get presentCount(): number {
    return this.students().filter(s => s.attendance === 'present' || s.attendance === 'late').length;
  }

  get selectedCount(): number {
    return this.students().filter(s => s.selected).length;
  }

  get finalXP(): number {
    return this.useCustomXP ? (parseInt(this.customXP, 10) || 0) : this.selectedXPPreset;
  }

  get finalReason(): string {
    return this.awardReason === 'Custom…' ? this.customReason : this.awardReason;
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      await this.router.navigate(['/instructor/sessions']);
      return;
    }

    this.sessionId.set(id);
    await this.loadLiveSessionData(id);
    this.setupRealtimeSubscription(id);
    this.isLoading.set(false);
  }

  ngOnDestroy(): void {
    if (this.alarmInterval) clearInterval(this.alarmInterval);
    this.teardownRealtimeSubscription();
  }

  private setupRealtimeSubscription(sid: string): void {
    if (!this.supabase.isConfigured()) return;

    try {
      this.channel = this.supabase.client
        .channel(`session-${sid}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'xp_events', filter: `session_id=eq.${sid}` },
          (payload) => {
            const ev = payload.new as { student_id: string; points: number; reason: string };
            if (ev && ev.student_id) {
              this.handleRealtimeXP(ev.student_id, ev.points, ev.reason);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'attendance', filter: `session_id=eq.${sid}` },
          (payload) => {
            const att = payload.new as { student_id: string; status: 'present' | 'absent' | 'late' };
            if (att && att.student_id) {
              this.handleRealtimeAttendance(att.student_id, att.status);
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isRealtimeActive.set(true);
          }
        });
    } catch {
      // Realtime fallback
    }
  }

  private teardownRealtimeSubscription(): void {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
      this.channel = null;
      this.isRealtimeActive.set(false);
    }
  }

  private handleRealtimeXP(studentId: string, points: number, reason: string): void {
    const s = this.students().find(st => st.id === studentId);
    if (!s) return;

    this.students.update(list =>
      list.map(item => item.id === studentId ? {
        ...item,
        xp_total: item.xp_total + points,
        earnedSessionXp: (item.earnedSessionXp || 0) + points,
      } : item)
    );

    const feedItem: LiveFeedEvent = {
      id: Math.random().toString(),
      studentName: s.full_name,
      points,
      reason: reason || 'Live Session Bonus',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    this.feed.update(f => [feedItem, ...f]);
    this.totalSessionXP.update(tot => tot + points);
  }

  private handleRealtimeAttendance(studentId: string, status: 'present' | 'absent' | 'late'): void {
    this.students.update(list =>
      list.map(item => item.id === studentId ? { ...item, attendance: status } : item)
    );
  }

  formatTimer(totalSecs: number): string {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(m)}:${pad(s)}`;
  }

  /* ── In-Session Alarm with Audio Synthesis ── */
  setAlarmDuration(seconds: number): void {
    this.isAlarmRunning.set(false);
    this.isAlarmRinging.set(false);
    if (this.alarmInterval) clearInterval(this.alarmInterval);
    this.alarmSeconds.set(seconds);
  }

  toggleAlarm(): void {
    if (this.isAlarmRunning()) {
      clearInterval(this.alarmInterval);
      this.isAlarmRunning.set(false);
    } else {
      if (this.alarmSeconds() <= 0) return;
      this.isAlarmRunning.set(true);
      this.isAlarmRinging.set(false);

      this.alarmInterval = setInterval(() => {
        this.alarmSeconds.update(sec => {
          if (sec <= 1) {
            clearInterval(this.alarmInterval);
            this.isAlarmRunning.set(false);
            this.isAlarmRinging.set(true);
            this.playAlarmSound();
            return 0;
          }
          return sec - 1;
        });
      }, 1000);
    }
  }

  resetAlarm(): void {
    if (this.alarmInterval) clearInterval(this.alarmInterval);
    this.isAlarmRunning.set(false);
    this.isAlarmRinging.set(false);
    this.alarmSeconds.set(300);
  }

  playAlarmSound(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // Play 3 pleasant chimes
      [0, 0.25, 0.5].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay); // A5 note
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.2);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.2);
      });
    } catch {
      // Audio context fallback
    }
  }

  async loadLiveSessionData(sid: string): Promise<void> {
    try {
      // 1. Load Session & Class Info
      const { data: sess, error: sessErr } = await this.supabase.client
        .from('sessions')
        .select('id, title, class_id, status, started_at, scheduled_at, gamification_mode, class:classes(name)')
        .eq('id', sid)
        .single();

      if (sessErr || !sess) throw sessErr;

      this.sessionTitle.set(sess.title);
      this.classId.set(sess.class_id);
      this.gamificationMode.set(sess.gamification_mode || 'xp_levels');
      const cName = Array.isArray(sess.class) ? sess.class[0]?.name : (sess.class as { name: string } | null)?.name;
      this.className.set(cName ?? 'Class');

      // 2. Load Students in Class (from students and class_members)
      const { data: stdData, error: stdErr } = await this.supabase.client
        .from('students')
        .select('id, full_name, display_name, xp_total, level')
        .eq('class_id', sess.class_id)
        .order('full_name', { ascending: true });

      if (stdErr) throw stdErr;

      // 3. Load Existing Attendance
      const { data: attData } = await this.supabase.client
        .from('attendance')
        .select('student_id, status')
        .eq('session_id', sid);

      const attMap = new Map<string, 'present' | 'absent' | 'late'>();
      (attData ?? []).forEach((a: { student_id: string; status: 'present' | 'absent' | 'late' }) => {
        attMap.set(a.student_id, a.status);
      });

      const liveStudents: LiveStudent[] = (stdData ?? []).map(s => ({
        id:              s.id,
        full_name:       s.full_name,
        xp_total:        s.xp_total ?? 0,
        level:           s.level ?? 1,
        attendance:      attMap.get(s.id) ?? 'present',
        selected:        false,
        earnedSessionXp: 0,
      }));

      this.students.set(liveStudents);

      // 4. Load Previous Feed Events in this Session
      const { data: xpData } = await this.supabase.client
        .from('xp_events')
        .select('id, points, reason, created_at, student:students(full_name)')
        .eq('session_id', sid)
        .order('created_at', { ascending: false })
        .limit(20);

      if (xpData) {
        const events: LiveFeedEvent[] = xpData.map((x: any) => ({
          id:          x.id,
          studentName: Array.isArray(x.student) ? (x.student[0]?.full_name ?? 'Student') : (x.student?.full_name ?? 'Student'),
          points:      x.points,
          reason:      x.reason?.replace('[Live Session] ', '') || 'Activity',
          timestamp:   new Date(x.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        this.feed.set(events);

        const totalEarned = events.reduce((sum, e) => sum + e.points, 0);
        this.totalSessionXP.set(totalEarned);
      }

    } catch (e: unknown) {
      console.error('[LiveWorkspace] Load error:', e);
    }
  }

  async toggleAttendance(student: LiveStudent, status: 'present' | 'absent' | 'late'): Promise<void> {
    this.students.update(list =>
      list.map(s => s.id === student.id ? { ...s, attendance: status } : s),
    );

    await this.sessionService.updateAttendance(this.sessionId(), student.id, status);
  }

  selectAll(select: boolean): void {
    this.students.update(list => list.map(s => ({ ...s, selected: select })));
  }

  toggleSelectStudent(student: LiveStudent): void {
    this.students.update(list =>
      list.map(s => s.id === student.id ? { ...s, selected: !s.selected } : s),
    );
  }

  async awardLiveXP(): Promise<void> {
    const selected = this.students().filter(s => s.selected);
    if (selected.length === 0 || this.finalXP <= 0) return;

    this.isAwarding.set(true);
    const points = this.finalXP;
    const reason = this.finalReason;

    try {
      const batchPayloads = selected.map(s => ({
        studentId:  s.id,
        sessionId:  this.sessionId(),
        classId:    this.classId(),
        points,
        reason:      `[Live Session] ${reason}`,
        sourceType: 'live_session',
      }));

      await this.xpService.awardBatchXp(batchPayloads);

      this.students.update(list =>
        list.map(s => s.selected ? {
          ...s,
          xp_total: s.xp_total + points,
          earnedSessionXp: (s.earnedSessionXp || 0) + points,
        } : s),
      );

      const newFeedEvents: LiveFeedEvent[] = selected.map(s => ({
        id:          Math.random().toString(),
        studentName: s.full_name,
        points,
        reason,
        timestamp:  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));

      this.feed.update(f => [...newFeedEvents, ...f]);
      this.totalSessionXP.update(tot => tot + (points * selected.length));
    } catch {
      // Error handled
    } finally {
      this.isAwarding.set(false);
    }
  }

  /* ── Award Team XP in Teams/Duels Mode ── */
  async awardTeamXP(team: 'red' | 'blue', points: number): Promise<void> {
    const teamStudents = team === 'red' ? this.teamRedStudents : this.teamBlueStudents;
    const teamName = team === 'red' ? 'Team Phoenix 🔥' : 'Team Titans ⚡';
    if (teamStudents.length === 0) return;

    this.isAwarding.set(true);
    try {
      const batchPayloads = teamStudents.map(s => ({
        studentId:  s.id,
        sessionId:  this.sessionId(),
        classId:    this.classId(),
        points,
        reason:      `[Team Duel] ${teamName} Victory Bonus`,
        sourceType: 'team_duel',
      }));

      await this.xpService.awardBatchXp(batchPayloads);

      const studentIds = new Set(teamStudents.map(s => s.id));
      this.students.update(list =>
        list.map(s => studentIds.has(s.id) ? {
          ...s,
          xp_total: s.xp_total + points,
          earnedSessionXp: (s.earnedSessionXp || 0) + points,
        } : s),
      );

      const feedItem: LiveFeedEvent = {
        id:          Math.random().toString(),
        studentName: teamName,
        points:      points * teamStudents.length,
        reason:      `Team Victory (+${points} XP to all ${teamStudents.length} members)`,
        timestamp:   new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      this.feed.update(f => [feedItem, ...f]);
      this.totalSessionXP.update(tot => tot + (points * teamStudents.length));
    } catch {
      // Error handled
    } finally {
      this.isAwarding.set(false);
    }
  }

  /* ── Award Badge in Badges/Mastery Mode ── */
  async awardLiveBadge(badge: BadgePreset): Promise<void> {
    const selected = this.students().filter(s => s.selected);
    if (selected.length === 0) return;

    this.isAwarding.set(true);
    try {
      const batchPayloads = selected.map(s => ({
        studentId:  s.id,
        sessionId:  this.sessionId(),
        classId:    this.classId(),
        points:     badge.xp,
        reason:      `[Badge Awarded] ${badge.icon} ${badge.name}`,
        sourceType: 'badge_unlock',
      }));

      await this.xpService.awardBatchXp(batchPayloads);

      this.students.update(list =>
        list.map(s => s.selected ? {
          ...s,
          xp_total: s.xp_total + badge.xp,
          earnedSessionXp: (s.earnedSessionXp || 0) + badge.xp,
        } : s),
      );

      const newFeedEvents: LiveFeedEvent[] = selected.map(s => ({
        id:          Math.random().toString(),
        studentName: s.full_name,
        points:      badge.xp,
        reason:      `${badge.icon} Badge: ${badge.name}`,
        timestamp:   new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));

      this.feed.update(f => [...newFeedEvents, ...f]);
      this.totalSessionXP.update(tot => tot + (badge.xp * selected.length));
    } catch {
      // Error handled
    } finally {
      this.isAwarding.set(false);
    }
  }

  /* ── End Session & Celebration Summary ── */
  openEndSessionSummary(): void {
    const sorted = [...this.students()].sort((a, b) => (b.earnedSessionXp || 0) - (a.earnedSessionXp || 0));
    this.mvpStudentName = sorted[0]?.full_name || 'All Students';
    this.showSummaryModal.set(true);
  }

  async confirmEndSession(): Promise<void> {
    this.isEnding.set(true);

    try {
      await this.sessionService.completeSession(this.sessionId(), {
        title:             this.sessionTitle(),
        className:         this.className(),
        durationMinutes:   45,
        totalXpAwarded:    this.totalSessionXP(),
        presentCount:      this.presentCount,
        totalStudents:     this.students().length,
        gamificationMode:  this.gamificationMode() as any,
        mvpStudentName:    this.mvpStudentName,
      });
    } catch (e: unknown) {
      console.warn('confirmEndSession non-blocking error:', e);
    } finally {
      this.showSummaryModal.set(false);
      this.isEnding.set(false);

      if (this.classId()) {
        await this.router.navigate(['/instructor/classes', this.classId()]);
      } else {
        await this.router.navigate(['/instructor/sessions']);
      }
    }
  }

  openAiDrawer(): void {
    this.isAiDrawerOpen.set(true);
  }

  closeAiDrawer(): void {
    this.isAiDrawerOpen.set(false);
  }
}
