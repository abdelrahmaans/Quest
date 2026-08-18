import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { XpService } from '../../../../core/services/xp.service';
import { SessionService } from '../../../../core/services/session.service';
import { IconComponent } from '../../../../shared/ui/icon/icon';
import type { GamificationModeId } from '../../sessions/sessions-list/sessions-list';

interface ClassInfo {
  id: string;
  name: string;
  subject: string | null;
  grade_level: string | null;
  public_code: string;
  gamification_mode: GamificationModeId;
  schedule_days?: string[] | null;
  schedule_time?: string | null;
  start_date?: string | null;
  total_sessions?: number | null;
  created_at: string;
}

interface StudentRow {
  id: string;
  full_name: string;
  display_name: string;
  xp_total: number;
  level: number;
  current_streak: number;
  class_id?: string | null;
  current_class_name?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
}

interface SessionRow {
  id: string;
  session_number: number;
  title: string;
  description: string | null;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  scheduled_at: string | null;
  started_at: string | null;
  duration_minutes: number | null;
  gamification_mode: GamificationModeId;
  created_at: string;
}

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe, IconComponent],
  templateUrl: './class-detail.html',
  styleUrl: './class-detail.css',
})
export class ClassDetailComponent implements OnInit {
  readonly route          = inject(ActivatedRoute);
  readonly router         = inject(Router);
  readonly auth           = inject(AuthService);
  readonly supabase       = inject(SupabaseService);
  readonly xpService      = inject(XpService);
  readonly sessionService = inject(SessionService);

  readonly classId    = signal<string>('');
  readonly classInfo  = signal<ClassInfo | null>(null);
  readonly students   = signal<StudentRow[]>([]);
  readonly sessions   = signal<SessionRow[]>([]);
  readonly isLoading  = signal(true);
  readonly error      = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);

  /* Active Tab */
  readonly activeTab = signal<'students' | 'sessions' | 'leaderboard'>('students');

  /* Next Upcoming Session Alert */
  readonly upcomingSessionAlert = computed(() => {
    const live = this.sessions().find(s => s.status === 'live');
    if (live) return { session: live, isLive: true, minsLeft: 0 };

    const now = new Date().getTime();
    const scheduled = this.sessions()
      .filter(s => s.status === 'scheduled' && (s.scheduled_at || s.started_at))
      .map(s => {
        const time = new Date(s.scheduled_at || s.started_at!).getTime();
        return { session: s, time, diffMins: Math.round((time - now) / 60000) };
      })
      .filter(s => s.diffMins >= -15 && s.diffMins <= 45)
      .sort((a, b) => a.diffMins - b.diffMins)[0];

    if (scheduled) {
      return { session: scheduled.session, isLive: false, minsLeft: scheduled.diffMins };
    }
    return null;
  });

  /* Smart Search & Enroll State */
  studentQuery             = '';
  readonly allInstructorStudents = signal<StudentRow[]>([]);
  isProcessingStudent      = signal(false);

  /* Filtered Search Results */
  readonly searchMatches = computed(() => {
    const q = this.studentQuery.trim().toLowerCase();
    if (!q) return [];
    const enrolledIds = new Set(this.students().map(s => s.id));
    return this.allInstructorStudents().filter(
      s => s.full_name.toLowerCase().includes(q) && !enrolledIds.has(s.id),
    );
  });

  /* Check if query is already enrolled in this class */
  readonly isAlreadyEnrolled = computed(() => {
    const q = this.studentQuery.trim().toLowerCase();
    if (!q) return false;
    return this.students().some(s => s.full_name.toLowerCase() === q);
  });

  /* Create Session Form */
  readonly showCreateSession = signal(false);
  readonly isCreatingSession = signal(false);
  sessionTitle = '';
  sessionDesc = '';
  sessionDate = '';
  sessionDuration = 45;
  selectedGamificationMode: GamificationModeId = 'xp_levels';

  readonly gamificationModes = [
    { id: 'xp_levels'     as GamificationModeId, name: '⚡ XP & Level Progression', desc: 'Points, streaks, & levels' },
    { id: 'teams_duels'   as GamificationModeId, name: '🛡️ Team Quests & Duels',    desc: 'Phoenix vs Titans battles' },
    { id: 'badges_mastery' as GamificationModeId, name: '🏆 Badges & Mastery',        desc: 'Special badges unlocking' },
    { id: 'hybrid_quest'  as GamificationModeId, name: '🎯 Custom Hybrid Quest',     desc: 'Full hybrid interactive mix' },
  ];

  /* Computed stats */
  get totalXp(): number {
    return this.students().reduce((acc, s) => acc + (s.xp_total || 0), 0);
  }

  get sortedLeaderboard(): StudentRow[] {
    return [...this.students()].sort((a, b) => (b.xp_total || 0) - (a.xp_total || 0));
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/instructor/classes']);
      return;
    }
    this.classId.set(id);
    await this.loadClassData();
  }

  async loadClassData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    const id = this.classId();
    const user = this.auth.currentUser() || (await this.supabase.client.auth.getUser()).data.user;

    try {
      // 1. Load Class Info
      const { data: cls, error: clsErr } = await this.supabase.client
        .from('classes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (clsErr) throw clsErr;
      if (!cls) throw new Error('Class not found. Please verify the class link or ID.');
      
      this.classInfo.set(cls as ClassInfo);
      this.selectedGamificationMode = cls.gamification_mode || 'xp_levels';

      // 2. Load Class Students (via students.class_id AND class_members)
      const { data: stds1 } = await this.supabase.client
        .from('students')
        .select('id, full_name, display_name, xp_total, level, current_streak, class_id, metadata, created_at')
        .eq('class_id', id);

      const { data: members } = await this.supabase.client
        .from('class_members')
        .select('student_id, student:students(id, full_name, display_name, xp_total, level, current_streak, class_id, metadata, created_at)')
        .eq('class_id', id);

      const studentMap = new Map<string, StudentRow>();
      (stds1 ?? []).forEach((s: any) => studentMap.set(s.id, s));
      (members ?? []).forEach((m: any) => {
        const s = Array.isArray(m.student) ? m.student[0] : m.student;
        if (s && s.id) studentMap.set(s.id, s);
      });

      this.students.set(Array.from(studentMap.values()).sort((a, b) => a.full_name.localeCompare(b.full_name)));

      // 3. Load Class Sessions (ordered ascending by session_number)
      const { data: sess, error: sessErr } = await this.supabase.client
        .from('sessions')
        .select('id, session_number, title, description, status, scheduled_at, started_at, duration_minutes, gamification_mode, created_at')
        .eq('class_id', id)
        .order('session_number', { ascending: true });

      if (sessErr) console.warn('Sessions load warn:', sessErr);
      this.sessions.set((sess ?? []).map((s: any) => ({
        ...s,
        gamification_mode: s.gamification_mode || 'xp_levels',
      })) as SessionRow[]);

      // 4. Load all instructor's students for the search dropdown
      const user = this.auth.currentUser();
      if (user) {
        const { data: allStds } = await this.supabase.client
          .from('students')
          .select('id, full_name, display_name, xp_total, level, current_streak, class_id, metadata, created_at')
          .eq('instructor_id', user.id)
          .order('full_name', { ascending: true });

        this.allInstructorStudents.set((allStds ?? []) as StudentRow[]);
      }
    } catch (e: unknown) {
      console.error('[ClassDetail] load error:', e);
      this.error.set((e as Error).message);
    } finally {
      this.isLoading.set(false);
    }
  }

  /* ── Attach Existing Found Student ── */
  async attachExistingStudent(student: StudentRow): Promise<void> {
    this.isProcessingStudent.set(true);
    this.error.set(null);
    const cls = this.classInfo();

    try {
      const updatedMeta = {
        ...(student.metadata || {}),
        last_assigned_class_id: this.classId(),
        last_assigned_class_name: cls?.name,
      };

      // 1. Update students table
      const { error } = await this.supabase.client
        .from('students')
        .update({
          class_id: this.classId(),
          metadata: updatedMeta,
        })
        .eq('id', student.id);

      if (error) throw error;

      // 2. Insert to class_members
      await this.supabase.client
        .from('class_members')
        .upsert({ class_id: this.classId(), student_id: student.id, joined_at: new Date().toISOString() });

      const enrolledStudent = { ...student, class_id: this.classId(), metadata: updatedMeta };
      this.students.update(list => [...list, enrolledStudent]);
      this.studentQuery = '';
      this.showToast(`✅ Existing student "${student.full_name}" enrolled in ${cls?.name}!`);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.isProcessingStudent.set(false);
    }
  }

  /* ── Create Brand New Student with Origin Class Tag ── */
  async createAndEnrollNewStudent(): Promise<void> {
    const name = this.studentQuery.trim();
    if (!name) return;

    this.isProcessingStudent.set(true);
    this.error.set(null);
    const user = this.auth.currentUser();
    const cls = this.classInfo();

    try {
      const initialMeta = {
        created_from_class_id:   this.classId(),
        created_from_class_name: cls?.name,
        created_at_timestamp:    new Date().toISOString(),
      };

      const { data: created, error } = await this.supabase.client
        .from('students')
        .insert({
          public_code:   `STD-${Date.now().toString(36).toUpperCase()}`,
          display_name:  name,
          full_name:     name,
          class_id:      this.classId(),
          instructor_id: user?.id ?? null,
          xp_total:      0,
          level:         1,
          current_streak: 0,
          metadata:      initialMeta,
        })
        .select('id, full_name, display_name, xp_total, level, current_streak, class_id, metadata, created_at')
        .single();

      if (error) throw error;

      if (created) {
        await this.supabase.client
          .from('class_members')
          .upsert({ class_id: this.classId(), student_id: created.id, joined_at: new Date().toISOString() });

        this.students.update(list => [...list, created as StudentRow]);
        this.allInstructorStudents.update(list => [...list, created as StudentRow]);
      }
      this.studentQuery = '';
      this.showToast(`✨ Brand new student "${name}" created and enrolled into ${cls?.name}!`);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.isProcessingStudent.set(false);
    }
  }

  /* ── Award Quick XP ── */
  async awardQuickXp(student: StudentRow, points: number): Promise<void> {
    try {
      const { error } = await this.xpService.awardXp({
        studentId:  student.id,
        classId:    this.classId(),
        points,
        reason:     'Class Activity Bonus',
        sourceType: 'manual',
      });

      if (error) throw error;

      this.students.update(list =>
        list.map(s => s.id === student.id ? { ...s, xp_total: (s.xp_total || 0) + points } : s),
      );
      this.showToast(`⭐ +${points} XP awarded to ${student.full_name}!`);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    }
  }

  /* ── Create Session ── */
  async createSession(): Promise<void> {
    if (!this.sessionTitle.trim()) return;
    this.isCreatingSession.set(true);
    this.error.set(null);

    try {
      const { data: newSess, error } = await this.sessionService.createSession({
        classId:          this.classId(),
        title:            this.sessionTitle,
        description:      this.sessionDesc,
        scheduledAt:      this.sessionDate,
        durationMinutes:  this.sessionDuration || 45,
        gamificationMode: this.selectedGamificationMode,
      });

      if (error) throw error;

      if (newSess) {
        this.sessions.update(list => [...list, newSess as SessionRow]);
      }

      this.sessionTitle = '';
      this.sessionDesc = '';
      this.sessionDate = '';
      this.showCreateSession.set(false);
      this.showToast(`🎮 Session created with ${this.selectedGamificationMode} mode!`);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.isCreatingSession.set(false);
    }
  }

  /* ── Update Gamification Mode for a Session ── */
  async updateSessionGamificationMode(sess: SessionRow, newMode: GamificationModeId): Promise<void> {
    try {
      await this.supabase.client
        .from('sessions')
        .update({ gamification_mode: newMode })
        .eq('id', sess.id);

      this.sessions.update(list =>
        list.map(s => s.id === sess.id ? { ...s, gamification_mode: newMode } : s),
      );
      this.showToast(`🎮 Updated session gamification mode to ${this.getModeName(newMode)}`);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    }
  }

  async launchLiveSession(session: SessionRow): Promise<void> {
    try {
      await this.sessionService.launchSession(session.id);
      await this.router.navigate(['/instructor/sessions', session.id, 'live']);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    }
  }

  showToast(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 4000);
  }

  getModeName(mode: GamificationModeId): string {
    switch (mode) {
      case 'teams_duels':    return '🛡️ Team Duels';
      case 'badges_mastery': return '🏆 Badges';
      case 'hybrid_quest':   return '🎯 Hybrid';
      default:               return '⚡ XP & Levels';
    }
  }

  getOriginClass(student: StudentRow): string | null {
    return student.metadata?.['created_from_class_name'] || student.metadata?.['last_assigned_class_name'] || null;
  }
}
