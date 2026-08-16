import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../../../shared/ui/icon/icon';

interface StudentItem {
  id: string;
  full_name: string;
  display_name: string;
  xp_total: number;
  level: number;
  selected?: boolean;
  created_at: string;
}

interface ClassRow {
  id: string;
  name: string;
  subject: string | null;
  grade_level: string | null;
  student_count: number;
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
  readonly auth     = inject(AuthService);
  readonly supabase = inject(SupabaseService);
  readonly router   = inject(Router);

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
  initialStudentNames = '';
  readonly allInstructorStudents = signal<StudentItem[]>([]);
  selectedExistingIds = new Set<string>();

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

      // Enrich with student counts
      const enriched = await Promise.all(
        (data ?? []).map(async (cls: { id: string; name: string; subject: string | null; grade_level: string | null; created_at: string }) => {
          const { count } = await this.supabase.client
            .from('students')
            .select('id', { count: 'exact', head: true })
            .eq('class_id', cls.id);
          return { ...cls, student_count: count ?? 0 };
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
        .select('id, full_name, display_name, xp_total, level, created_at')
        .eq('instructor_id', user.id)
        .order('full_name', { ascending: true });

      this.allInstructorStudents.set((data ?? []) as StudentItem[]);
    } catch (e) {
      console.warn('Could not load all students:', e);
    }
  }

  toggleStudentSelection(studentId: string): void {
    if (this.selectedExistingIds.has(studentId)) {
      this.selectedExistingIds.delete(studentId);
    } else {
      this.selectedExistingIds.add(studentId);
    }
  }

  isStudentSelected(studentId: string): boolean {
    return this.selectedExistingIds.has(studentId);
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
          public_code:  publicCode,
          name:         this.className.trim(),
          subject:      this.classSubject.trim() || null,
          grade_level:  this.classGrade.trim()   || null,
          instructor_id: user.id,
        })
        .select('id')
        .single();

      if (error) throw error;

      // 1. Attach selected existing students to this new class
      if (newClass?.id && this.selectedExistingIds.size > 0) {
        const ids = Array.from(this.selectedExistingIds);
        await this.supabase.client
          .from('students')
          .update({ class_id: newClass.id })
          .in('id', ids);
      }

      // 2. Insert new students by name
      if (newClass?.id && this.initialStudentNames.trim()) {
        const names = this.initialStudentNames
          .split('\n')
          .map(n => n.trim())
          .filter(n => n.length > 0);

        if (names.length > 0) {
          const studentInserts = names.map(name => ({
            public_code:   `STD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            display_name:  name,
            full_name:     name,
            class_id:      newClass.id,
            instructor_id: user.id,
            xp_total:      0,
            level:         1,
            current_streak: 0,
          }));

          await this.supabase.client.from('students').insert(studentInserts);
        }
      }

      this.successMsg.set(`✅ Class "${this.className.trim()}" created successfully!`);
      this.className = '';
      this.classSubject = '';
      this.classGrade = '';
      this.initialStudentNames = '';
      this.selectedExistingIds.clear();
      this.showCreate.set(false);
      await this.loadClasses();
      await this.loadAllStudents();

      setTimeout(() => this.successMsg.set(null), 4000);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.creating.set(false);
    }
  }

  /* ── Student Management Modal ── */
  async openStudentsModal(cls: ClassRow, event: MouseEvent): Promise<void> {
    event.stopPropagation(); // prevent card click navigation
    this.activeClassModal.set(cls);
    this.loadingStudents.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('students')
        .select('id, full_name, display_name, xp_total, level, created_at')
        .eq('class_id', cls.id)
        .order('full_name', { ascending: true });

      if (error) throw error;
      this.classStudents.set((data ?? []) as StudentItem[]);
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
