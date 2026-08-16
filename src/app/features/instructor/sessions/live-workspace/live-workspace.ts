import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../../../core/auth/auth.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { XpService } from '../../../../core/services/xp.service';
import { IconComponent } from '../../../../shared/ui/icon/icon';
import { AiAssistantDrawerComponent } from '../../../../shared/ui/ai-assistant-drawer/ai-assistant-drawer';
import type { IconName } from '../../../../shared/ui/icon/icons.constants';

interface LiveStudent {
  id: string;
  full_name: string;
  xp_total: number;
  level: number;
  attendance: 'present' | 'absent' | 'late';
  selected: boolean;
}

interface LiveFeedEvent {
  id: string;
  studentName: string;
  points: number;
  reason: string;
  timestamp: string;
}

@Component({
  selector: 'app-live-workspace',
  standalone: true,
  imports: [RouterLink, FormsModule, DecimalPipe, IconComponent, AiAssistantDrawerComponent],
  templateUrl: './live-workspace.html',
  styleUrl: './live-workspace.css',
})
export class LiveWorkspaceComponent implements OnInit, OnDestroy {
  readonly auth      = inject(AuthService);
  readonly supabase  = inject(SupabaseService);
  readonly xpService = inject(XpService);

  /* AI Assistant State */
  readonly isAiDrawerOpen = signal<boolean>(false);
  readonly route    = inject(ActivatedRoute);
  readonly router   = inject(Router);

  readonly isLoading    = signal(true);
  readonly isEnding     = signal(false);
  readonly isAwarding   = signal(false);
  readonly sessionId    = signal<string>('');
  readonly sessionTitle = signal<string>('Live Session Workspace');
  readonly className    = signal<string>('');
  readonly classId      = signal<string>('');

  /* Session Stats */
  readonly students       = signal<LiveStudent[]>([]);
  readonly feed           = signal<LiveFeedEvent[]>([]);
  readonly totalSessionXP = signal<number>(0);
  readonly elapsedSeconds = signal<number>(0);

  /* Realtime & Timer handles */
  private timerInterval: any = null;
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
    this.startTimer();
    this.setupRealtimeSubscription(id);
    this.isLoading.set(false);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.teardownRealtimeSubscription();
  }

  private setupRealtimeSubscription(sid: string): void {
    if (!this.supabase.isConfigured()) return;

    try {
      this.channel = this.supabase.client
        .channel(`live_session_${sid}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'xp_events' },
          (payload) => {
            const event = payload.new as { student_id: string; points: number; reason: string };
            if (event && event.student_id) {
              this.handleRealtimeXP(event.student_id, event.points, event.reason);
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
      // Graceful fallback if realtime is unavailable
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

    // Update local student XP total
    this.students.update(list =>
      list.map(item => item.id === studentId ? { ...item, xp_total: item.xp_total + points } : item)
    );

    // Push to live feed stream
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

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds.update(s => s + 1);
    }, 1000);
  }

  formatTimer(totalSecs: number): string {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  async loadLiveSessionData(sid: string): Promise<void> {
    try {
      // 1. Load Session & Class Name
      const { data: sess, error: sessErr } = await this.supabase.client
        .from('sessions')
        .select('id, title, class_id, status, class:classes(name)')
        .eq('id', sid)
        .single();

      if (sessErr || !sess) throw sessErr;

      this.sessionTitle.set(sess.title);
      this.classId.set(sess.class_id);
      const cName = Array.isArray(sess.class) ? sess.class[0]?.name : (sess.class as { name: string } | null)?.name;
      this.className.set(cName ?? 'Class');

      // 2. Load Students in Class
      const { data: studData } = await this.supabase.client
        .from('students')
        .select('id, full_name, xp_total, level')
        .eq('class_id', sess.class_id)
        .order('full_name');

      // 3. Load Existing Attendance for this session
      const { data: attData } = await this.supabase.client
        .from('attendance')
        .select('student_id, status')
        .eq('session_id', sid);

      const attMap = new Map((attData ?? []).map((a: { student_id: string; status: string }) => [a.student_id, a.status]));

      const list: LiveStudent[] = (studData ?? []).map((s: { id: string; full_name: string; xp_total: number; level: number }) => ({
        id:         s.id,
        full_name:  s.full_name,
        xp_total:   s.xp_total ?? 0,
        level:      s.level     ?? 1,
        attendance: (attMap.get(s.id) as 'present' | 'absent' | 'late') ?? 'present',
        selected:   true,
      }));

      this.students.set(list);
    } catch {
      // Fallback redirect if session invalid
      await this.router.navigate(['/instructor/sessions']);
    }
  }

  async toggleAttendance(student: LiveStudent, status: 'present' | 'absent' | 'late'): Promise<void> {
    this.students.update(list =>
      list.map(s => s.id === student.id ? { ...s, attendance: status } : s),
    );

    // Save attendance change to Supabase
    try {
      await this.supabase.client.from('attendance').upsert({
        session_id: this.sessionId(),
        student_id: student.id,
        status,
      });
    } catch {
      // Non-critical background save
    }
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
    const user = this.auth.currentUser();
    if (!user) return;

    const points = this.finalXP;
    const reason = this.finalReason;

    try {
      // Award XP using centralized XpService
      const batchPayloads = selected.map(s => ({
        studentId:  s.id,
        sessionId:  this.sessionId(),
        classId:    this.classId(),
        points,
        reason:      `[Live Session] ${reason}`,
        sourceType: 'live_session',
      }));

      await this.xpService.awardBatchXp(batchPayloads);

      // Update local state XP totals
      this.students.update(list =>
        list.map(s => s.selected ? { ...s, xp_total: s.xp_total + points } : s),
      );

      // Push events to live feed
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
      // Handle error gracefully
    } finally {
      this.isAwarding.set(false);
    }
  }

  async endSession(): Promise<void> {
    this.isEnding.set(true);

    try {
      await this.supabase.client
        .from('sessions')
        .update({ status: 'completed' })
        .eq('id', this.sessionId());

      await this.router.navigate(['/instructor/sessions']);
    } catch {
      this.isEnding.set(false);
    }
  }

  openAiDrawer(): void {
    this.isAiDrawerOpen.set(true);
  }

  closeAiDrawer(): void {
    this.isAiDrawerOpen.set(false);
  }
}

