import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../../../shared/ui/icon/icon';

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

  readonly isLoading  = signal(true);
  readonly classes    = signal<ClassRow[]>([]);
  readonly showCreate = signal(false);
  readonly creating   = signal(false);
  readonly error      = signal<string | null>(null);

  /* Create form */
  className   = '';
  classSubject = '';
  classGrade  = '';

  async ngOnInit(): Promise<void> {
    await this.loadClasses();
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

  async createClass(): Promise<void> {
    if (!this.className.trim()) return;
    this.creating.set(true);
    this.error.set(null);

    const user = this.auth.currentUser();
    if (!user) return;

    try {
      const publicCode = `CLS-${Date.now().toString(36).toUpperCase()}`;
      const { error } = await this.supabase.client.from('classes').insert({
        public_code:  publicCode,
        name:         this.className.trim(),
        subject:      this.classSubject.trim() || null,
        grade_level:  this.classGrade.trim()   || null,
        instructor_id: user.id,
      });

      if (error) throw error;

      // Reset and reload
      this.className = '';
      this.classSubject = '';
      this.classGrade = '';
      this.showCreate.set(false);
      await this.loadClasses();
    } catch (e: unknown) {
      this.error.set((e as Error).message);
    } finally {
      this.creating.set(false);
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
