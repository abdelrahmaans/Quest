import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { XpService } from '../../../../core/services/xp.service';
import { IconComponent } from '../../../../shared/ui/icon/icon';
import type { GamificationModeId } from '../../sessions/sessions-list/sessions-list';

interface ClassInfo {
  id: string;
  name: string;
  subject: string | null;
  grade_level: string | null;
  public_code: string;
  gamification_mode: GamificationModeId;
  created_at: string;
}

interface StudentRow {
  id: string;
  full_name: string;
  display_name: string;
  xp_total: number;
  level: number;
  current_streak: number;
  created_at: string;
}

interface SessionRow {
  id: string;
  session_number: number;
  title: string;
  description: string | null;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
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
  readonly route     = inject(ActivatedRoute);
  readonly router    = inject(Router);
  readonly auth      = inject(AuthService);
  readonly supabase  = inject(SupabaseService);
  readonly xpService = inject(XpService);

  readonly classId = signal<string>('');
  readonly classInfo = signal<ClassInfo | null>(null);
  readonly students  = signal<StudentRow[]>([]);
  readonly sessions  = signal<SessionRow[]>([]);
  readonly isLoading = signal(true);
  readonly error     = signal<string | null>(null);
  readonly successMsg= signal<string | null>(null);

  /* Active Tab */
  readonly activeTab = signal<'students' | 'sessions' | 'leaderboard'>('students');

  /* Add Student Form */
  newStudentName   = '';
  isAddingStudent  = signal(false);

  /* Existing Students to attach */
  readonly availableStudents = signal<StudentRow[]>([]);
  selectedExistingStudentId = '';
  isAttachingStudent        = signal(false);

  /* Create Session Form */
  readonly showCreateSession = signal(false);
  readonly isCreatingSession = signal(false);
  sessionTitle = '';
  sessionDesc = '';
  sessionDate = '';
  sessionDuration = 45;
  selectedGamificationMode: GamificationModeId = 'xp_levels';

  readonly gamificationModes = [
    { id: 'xp_levels'     as GamificationModeId, name: '⚡ XP & Level Progression', desc: 'Classic points, levels, and individual streaks' },
    { id: 'teams_duels'   as GamificationModeId, name: '🛡️ Team Quests & Duels',    desc: 'Group challenges, team battles, and collaborative XP' },
    { id: 'badges_mastery' as GamificationModeId, name: '🏆 Badges & Mastery',        desc: 'Milestone achievements and target criteria unlocks' },
    { id: 'hybrid_quest'  as GamificationModeId, name: '🎯 Custom Hybrid Quest',     desc: 'Customizable mix of XP, badges, and live challenges' },
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
    const user = this.auth.currentUser();

    try {
      // 1. Load Class Info
      const { data: cls, error: clsErr } = await this.supabase.client
        .from('classes')
        .select('id, name, subject, grade_level, public_code, gamification_mode, created_at')
        .eq('id', id)
        .single();

      if (clsErr || !cls) throw clsErr || new Error('Class not found');
      this.classInfo.set(cls as ClassInfo);
      this.selectedGamificationMode = cls.gamification_mode || 'xp_levels';

      // 2. Load Class Students
      const { data: stds, error: stdErr } = await this.supabase.client
        .from('students')
        .select('id, full_name, display_name, xp_total, level, current_streak, created_at')
        .eq('class_id', id)
        .order('full_name', { ascending: true });

      if (stdErr) throw stdErr;
      this.students.set((stds ?? []) as StudentRow[]);

      // 3. Load Class Sessions
      const { data: sess, error: sessErr } = await this.supabase.client
        .from('sessions')
        .select('id, session_number, title, description, status, started_at, duration_minutes, gamification_mode, created_at')
        .eq('class_id', id)
        .order('session_number', { ascending: false });

      if (sessErr) throw sessErr;
      this.sessions.set((sess ?? []).map((s: any) => ({
        ...s,
        gamification_mode: s.gamification_mode || 'xp_levels',
      })) as SessionRow[]);

      // 4. Load available students (not in this class)
      if (user) {
        const { data: allStds } = await this.supabase.client
          .from('students')
          .select('id, full_name, display_name, xp_total, level, current_streak, created_at')
          .eq('instructor_id', user.id)
          .neq('class_id', id);

        this.availableStudents.set((allStds ?? []) as StudentRow[]);
      }
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.isLoading.set(false);
    }
  }

  /* ── Add New Student by Name ── */
  async addNewStudent(): Promise<void> {
    if (!this.newStudentName.trim()) return;
    this.isAddingStudent.set(true);
    this.error.set(null);
    const user = this.auth.currentUser();

    try {
      const name = this.newStudentName.trim();
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
        })
        .select('id, full_name, display_name, xp_total, level, current_streak, created_at')
        .single();

      if (error) throw error;
      if (created) {
        this.students.update(list => [...list, created as StudentRow]);
      }
      this.newStudentName = '';
      this.showToast(`✅ Student "${name}" enrolled successfully!`);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.isAddingStudent.set(false);
    }
  }

  /* ── Attach Existing Student ── */
  async attachExistingStudent(): Promise<void> {
    if (!this.selectedExistingStudentId) return;
    this.isAttachingStudent.set(true);
    this.error.set(null);

    try {
      const { error } = await this.supabase.client
        .from('students')
        .update({ class_id: this.classId() })
        .eq('id', this.selectedExistingStudentId);

      if (error) throw error;

      const attached = this.availableStudents().find(s => s.id === this.selectedExistingStudentId);
      if (attached) {
        this.students.update(list => [...list, attached]);
        this.availableStudents.update(list => list.filter(s => s.id !== attached.id));
      }
      this.selectedExistingStudentId = '';
      this.showToast(`✅ Student added to class!`);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.isAttachingStudent.set(false);
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
      const { count } = await this.supabase.client
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', this.classId());

      const nextNum = (count ?? 0) + 1;

      const { data: newSess, error } = await this.supabase.client
        .from('sessions')
        .insert({
          class_id:          this.classId(),
          session_number:    nextNum,
          title:             this.sessionTitle.trim(),
          description:       this.sessionDesc.trim() || null,
          started_at:        this.sessionDate ? new Date(this.sessionDate).toISOString() : null,
          duration_minutes:  this.sessionDuration || 45,
          status:            this.sessionDate ? 'scheduled' : 'draft',
          gamification_mode: this.selectedGamificationMode,
        })
        .select('id, session_number, title, description, status, started_at, duration_minutes, gamification_mode, created_at')
        .single();

      if (error) throw error;

      if (newSess) {
        this.sessions.update(list => [newSess as SessionRow, ...list]);
      }

      this.sessionTitle = '';
      this.sessionDesc = '';
      this.sessionDate = '';
      this.showCreateSession.set(false);
      this.showToast(`🎮 Session #${nextNum} created with ${this.selectedGamificationMode} mode!`);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.isCreatingSession.set(false);
    }
  }

  async launchLiveSession(session: SessionRow): Promise<void> {
    try {
      await this.supabase.client
        .from('sessions')
        .update({ status: 'live' })
        .eq('id', session.id);

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
      case 'teams_duels':    return '🛡️ Team Quests & Duels';
      case 'badges_mastery': return '🏆 Badges & Mastery';
      case 'hybrid_quest':   return '🎯 Custom Hybrid Quest';
      default:               return '⚡ XP & Levels';
    }
  }
}
