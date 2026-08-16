import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SessionService } from '../../../core/services/session.service';
import { IconComponent } from '../../../shared/ui/icon/icon';
import type { GamificationModeId } from '../sessions/sessions-list/sessions-list';

interface StudentItem {
  id: string;
  full_name: string;
  display_name: string;
  xp_total: number;
  level: number;
  class_id?: string | null;
  current_class_name?: string | null;
  created_at: string;
}

interface ClassRow {
  id: string;
  name: string;
  subject: string | null;
  grade_level: string | null;
  student_count: number;
  session_count?: number;
  created_at: string;
}

@Component({
  selector: 'app-instructor-classes',
  standalone: true,
  imports: [RouterLink, FormsModule, IconComponent],
  templateUrl: './classes.html',
  styleUrl: './classes.css',
})
export class InstructorClassesComponent implements OnInit {
  readonly auth           = inject(AuthService);
  readonly supabase       = inject(SupabaseService);
  readonly sessionService = inject(SessionService);
  readonly router         = inject(Router);

  readonly isLoading    = signal(true);
  readonly classes      = signal<ClassRow[]>([]);
  readonly showCreate   = signal(false);
  readonly creating     = signal(false);
  readonly error        = signal<string | null>(null);
  readonly successMsg   = signal<string | null>(null);

  /* Create class form */
  className           = '';
  classSubject        = '';
  classGrade          = '';
  
  /* Schedule & Auto Sessions Generation */
  autoGenerateSessions    = true;
  startDate               = new Date().toISOString().split('T')[0];
  scheduleTime            = '16:00';
  selectedScheduleDays    = ['Sunday', 'Tuesday'];
  totalSessions           = 8;
  selectedGamificationMode: GamificationModeId = 'xp_levels';

  readonly daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  readonly gamificationModes = [
    { id: 'xp_levels'     as GamificationModeId, name: '⚡ XP & Level Progression', desc: 'Points, streaks, & rankings' },
    { id: 'teams_duels'   as GamificationModeId, name: '🛡️ Team Quests & Duels',    desc: 'Phoenix vs Titans battles' },
    { id: 'badges_mastery' as GamificationModeId, name: '🏆 Badges & Mastery',        desc: 'Special badges unlocking' },
    { id: 'hybrid_quest'  as GamificationModeId, name: '🎯 Custom Hybrid Quest',     desc: 'Full hybrid interactive mix' },
  ];

  /* Smart Search & Enrollment during creation */
  studentSearchQuery  = '';
  readonly allInstructorStudents = signal<StudentItem[]>([]);
  readonly selectedExistingStudents = signal<StudentItem[]>([]);
  readonly queuedNewStudentNames    = signal<string[]>([]);

  readonly createSearchMatches = computed(() => {
    const q = this.studentSearchQuery.trim().toLowerCase();
    if (!q) return [];
    const selectedIds = new Set(this.selectedExistingStudents().map(s => s.id));
    return this.allInstructorStudents().filter(
      s => s.full_name.toLowerCase().includes(q) && !selectedIds.has(s.id),
    );
  });

  readonly isAlreadySelectedOrQueued = computed(() => {
    const q = this.studentSearchQuery.trim().toLowerCase();
    if (!q) return false;
    const inExisting = this.selectedExistingStudents().some(s => s.full_name.toLowerCase() === q);
    const inQueued = this.queuedNewStudentNames().some(n => n.toLowerCase() === q);
    return inExisting || inQueued;
  });

  /* Active Class Modal / Drawer for Students Management */
  readonly activeClassModal = signal<ClassRow | null>(null);
  readonly classStudents    = signal<StudentItem[]>([]);
  readonly loadingStudents  = signal(false);
  newStudentName            = '';
  addingStudent             = false;

  async ngOnInit(): Promise<void> {
    await this.loadClasses();
    await this.loadAllStudents();
  }

  async loadClasses(): Promise<void> {
    this.isLoading.set(true);
    const user = this.auth.currentUser();
    if (!user) return;

    try {
      const { data, error } = await this.supabase.client
        .from('classes')
        .select('id, name, subject, grade_level, created_at')
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched = await Promise.all(
        (data ?? []).map(async (cls: { id: string; name: string; subject: string | null; grade_level: string | null; created_at: string }) => {
          const { data: stds } = await this.supabase.client
            .from('students')
            .select('id')
            .eq('class_id', cls.id);

          const { data: members } = await this.supabase.client
            .from('class_members')
            .select('student_id')
            .eq('class_id', cls.id);

          const uniqueStudentIds = new Set([
            ...(stds ?? []).map(s => s.id),
            ...(members ?? []).map(m => m.student_id),
          ]);

          const { count: sessCount } = await this.supabase.client
            .from('sessions')
            .select('id', { count: 'exact', head: true })
            .eq('class_id', cls.id);

          return { ...cls, student_count: uniqueStudentIds.size, session_count: sessCount ?? 0 };
        }),
      );

      this.classes.set(enriched);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadAllStudents(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    try {
      const { data } = await this.supabase.client
        .from('students')
        .select(`
          id, full_name, display_name, xp_total, level, class_id, created_at,
          class:classes(name)
        `)
        .eq('instructor_id', user.id)
        .order('full_name', { ascending: true });

      const mapped = (data ?? []).map((s: any) => ({
        id: s.id,
        full_name: s.full_name,
        display_name: s.display_name,
        xp_total: s.xp_total,
        level: s.level,
        class_id: s.class_id,
        current_class_name: Array.isArray(s.class) ? (s.class[0]?.name ?? null) : s.class?.name ?? null,
        created_at: s.created_at,
      }));

      this.allInstructorStudents.set(mapped as StudentItem[]);
    } catch (e) {
      console.warn('Could not load all students:', e);
    }
  }

  toggleScheduleDay(day: string): void {
    if (this.selectedScheduleDays.includes(day)) {
      this.selectedScheduleDays = this.selectedScheduleDays.filter(d => d !== day);
    } else {
      this.selectedScheduleDays = [...this.selectedScheduleDays, day];
    }
  }

  /* ── Smart Selection Helpers for Create Class ── */
  selectExistingStudent(std: StudentItem): void {
    if (!this.selectedExistingStudents().some(s => s.id === std.id)) {
      this.selectedExistingStudents.update(list => [...list, std]);
    }
    this.studentSearchQuery = '';
  }

  removeSelectedExistingStudent(id: string): void {
    this.selectedExistingStudents.update(list => list.filter(s => s.id !== id));
  }

  queueNewStudent(): void {
    const name = this.studentSearchQuery.trim();
    if (!name) return;
    if (!this.queuedNewStudentNames().includes(name)) {
      this.queuedNewStudentNames.update(list => [...list, name]);
    }
    this.studentSearchQuery = '';
  }

  removeQueuedNewStudent(name: string): void {
    this.queuedNewStudentNames.update(list => list.filter(n => n !== name));
  }

  async createClass(): Promise<void> {
    if (!this.className.trim()) return;
    this.creating.set(true);
    this.error.set(null);
    this.successMsg.set(null);

    const user = this.auth.currentUser();
    if (!user) return;

    try {
      const publicCode = `CLS-${Date.now().toString(36).toUpperCase()}`;
      const { data: newClass, error } = await this.supabase.client
        .from('classes')
        .insert({
          public_code:       publicCode,
          name:              this.className.trim(),
          subject:           this.classSubject.trim() || null,
          grade_level:       this.classGrade.trim()   || null,
          instructor_id:     user.id,
          gamification_mode: this.selectedGamificationMode,
          schedule_days:     this.selectedScheduleDays,
          schedule_time:     this.scheduleTime,
          start_date:        this.startDate,
          total_sessions:    this.totalSessions,
        })
        .select('id')
        .single();

      if (error) throw error;

      // 1. Attach selected existing students
      const existingIds = this.selectedExistingStudents().map(s => s.id);
      if (newClass?.id && existingIds.length > 0) {
        await this.supabase.client
          .from('students')
          .update({
            class_id: newClass.id,
            metadata: {
              last_assigned_class_id: newClass.id,
              last_assigned_class_name: this.className.trim(),
            },
          })
          .in('id', existingIds);
      }

      // 2. Insert queued new students with origin class metadata
      const newNames = this.queuedNewStudentNames();
      if (newClass?.id && newNames.length > 0) {
        const studentInserts = newNames.map(name => ({
          public_code:   `STD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          display_name:  name,
          full_name:     name,
          class_id:      newClass.id,
          instructor_id: user.id,
          xp_total:      0,
          level:         1,
          current_streak: 0,
          metadata: {
            created_from_class_id:   newClass.id,
            created_from_class_name: this.className.trim(),
            created_at_timestamp:    new Date().toISOString(),
          },
        }));

        await this.supabase.client.from('students').insert(studentInserts);
      }

      // 3. Auto-generate scheduled sessions for this class
      if (newClass?.id && this.autoGenerateSessions && this.selectedScheduleDays.length > 0) {
        await this.sessionService.autoGenerateClassSessions({
          classId:                 newClass.id,
          className:               this.className.trim(),
          startDate:               this.startDate,
          scheduleDays:            this.selectedScheduleDays,
          scheduleTime:            this.scheduleTime,
          totalSessions:           this.totalSessions || 8,
          defaultGamificationMode: this.selectedGamificationMode,
        });
      }

      const totalEnrolled = existingIds.length + newNames.length;
      this.successMsg.set(`✅ Class "${this.className.trim()}" created with ${totalEnrolled} students and ${this.totalSessions} scheduled sessions!`);
      
      this.className = '';
      this.classSubject = '';
      this.classGrade = '';
      this.studentSearchQuery = '';
      this.selectedExistingStudents.set([]);
      this.queuedNewStudentNames.set([]);
      this.showCreate.set(false);
      await this.loadClasses();
      await this.loadAllStudents();

      setTimeout(() => this.successMsg.set(null), 5000);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.creating.set(false);
    }
  }

  /* ── Student Management Quick Modal ── */
  async openStudentsModal(cls: ClassRow, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    this.activeClassModal.set(cls);
    this.loadingStudents.set(true);
    try {
      const { data: stds1 } = await this.supabase.client
        .from('students')
        .select('id, full_name, display_name, xp_total, level, created_at')
        .eq('class_id', cls.id);

      const { data: members } = await this.supabase.client
        .from('class_members')
        .select('student:students(id, full_name, display_name, xp_total, level, created_at)')
        .eq('class_id', cls.id);

      const map = new Map<string, StudentItem>();
      (stds1 ?? []).forEach((s: any) => map.set(s.id, s));
      (members ?? []).forEach((m: any) => {
        const s = Array.isArray(m.student) ? m.student[0] : m.student;
        if (s && s.id) map.set(s.id, s);
      });

      this.classStudents.set(Array.from(map.values()).sort((a, b) => a.full_name.localeCompare(b.full_name)));
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.loadingStudents.set(false);
    }
  }

  closeStudentsModal(): void {
    this.activeClassModal.set(null);
    this.classStudents.set([]);
    this.newStudentName = '';
  }

  async addStudentToActiveClass(): Promise<void> {
    const cls = this.activeClassModal();
    const user = this.auth.currentUser();
    if (!cls || !user || !this.newStudentName.trim()) return;

    this.addingStudent = true;
    try {
      const name = this.newStudentName.trim();
      const { data: newStd, error } = await this.supabase.client
        .from('students')
        .insert({
          public_code:   `STD-${Date.now().toString(36).toUpperCase()}`,
          display_name:  name,
          full_name:     name,
          class_id:      cls.id,
          instructor_id: user.id,
          xp_total:      0,
          level:         1,
          current_streak: 0,
          metadata: {
            created_from_class_id:   cls.id,
            created_from_class_name: cls.name,
            created_at_timestamp:    new Date().toISOString(),
          },
        })
        .select('id, full_name, display_name, xp_total, level, created_at')
        .single();

      if (error) throw error;

      if (newStd) {
        this.classStudents.update(list => [...list, newStd as StudentItem]);
      }
      this.newStudentName = '';
      await this.loadClasses();
      await this.loadAllStudents();
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.addingStudent = false;
    }
  }

  goToClassHub(cls: ClassRow): void {
    this.router.navigate(['/instructor/classes', cls.id]);
  }

  goToCreateSession(cls: ClassRow, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.router.navigate(['/instructor/sessions'], { queryParams: { class: cls.id } });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
