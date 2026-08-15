import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { AuthService } from '../../../../core/auth/auth.service';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { IconComponent } from '../../../../shared/ui/icon/icon';

interface ClassItem { id: string; name: string; }

interface SessionRow {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'scheduled' | 'live' | 'completed' | 'cancelled';
  scheduled_at: string | null;
  duration_minutes: number | null;
  class_id: string;
  class_name: string;
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
  readonly auth     = inject(AuthService);
  readonly supabase = inject(SupabaseService);
  readonly router   = inject(Router);

  readonly isLoading   = signal(true);
  readonly sessions    = signal<SessionRow[]>([]);
  readonly classes     = signal<ClassItem[]>([]);
  readonly activeTab   = signal<'all' | 'live' | 'scheduled' | 'completed'>('all');
  readonly showCreate  = signal(false);
  readonly isCreating  = signal(false);
  readonly error       = signal<string | null>(null);

  /* Form */
  selectedClassId = '';
  sessionTitle    = '';
  sessionDesc     = '';
  scheduledDate   = '';
  durationMins    = 45;

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
      .from('classes').select('id, name').eq('instructor_id', user.id).order('name');
    this.classes.set(data ?? []);
  }

  async loadSessions(): Promise<void> {
    const user = this.auth.currentUser();
    if (!user) return;

    try {
      const { data, error } = await this.supabase.client
        .from('sessions')
        .select(`
          id, session_number, title, description, status, started_at, duration_minutes, class_id, created_at,
          class:classes(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: SessionRow[] = (data ?? []).map((s: {
        id: string; title: string; description: string | null; status: any;
        started_at: string | null; duration_minutes: number | null; class_id: string; created_at: string;
        class: { name: string }[] | { name: string } | null;
      }) => ({
        id:               s.id,
        title:            s.title,
        description:      s.description,
        status:           s.status,
        scheduled_at:     s.started_at,
        duration_minutes: s.duration_minutes,
        class_id:         s.class_id,
        class_name:       Array.isArray(s.class) ? (s.class[0]?.name ?? '—') : (s.class as { name: string } | null)?.name ?? '—',
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

    const user = this.auth.currentUser();
    if (!user) return;

    try {
      // Calculate next session_number for this class
      const { count } = await this.supabase.client
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', this.selectedClassId);

      const nextNum = (count ?? 0) + 1;

      const { error } = await this.supabase.client.from('sessions').insert({
        class_id:         this.selectedClassId,
        session_number:   nextNum,
        title:            this.sessionTitle.trim(),
        description:      this.sessionDesc.trim() || null,
        started_at:       this.scheduledDate ? new Date(this.scheduledDate).toISOString() : null,
        duration_minutes: this.durationMins || 45,
        status:           this.scheduledDate ? 'scheduled' : 'draft',
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
      const { error } = await this.supabase.client
        .from('sessions')
        .update({ status: 'live' })
        .eq('id', session.id);

      if (error) throw error;

      await this.router.navigate(['/instructor/sessions', session.id, 'live']);
    } catch (e: unknown) {
      this.error.set((e as Error).message);
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
