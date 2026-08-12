import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../../../shared/ui/icon/icon';

interface AuditLogEvent {
  id: string;
  type: string;
  description: string;
  actor: string;
  created_at: string;
}

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [DatePipe, IconComponent],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css',
})
export class AdminAuditLogsComponent implements OnInit {
  readonly supabase = inject(SupabaseService);

  readonly isLoading = signal(true);
  readonly logs      = signal<AuditLogEvent[]>([]);

  async ngOnInit(): Promise<void> {
    await this.loadAuditLogs();
  }

  async loadAuditLogs(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Load recent XP events and user profile registrations as activity stream
      const { data: xpData } = await this.supabase.client
        .from('xp_events')
        .select('id, points, reason, created_at, awarded_by')
        .order('created_at', { ascending: false })
        .limit(20);

      const events: AuditLogEvent[] = await Promise.all(
        (xpData ?? []).map(async (ev: { id: string; points: number; reason: string; created_at: string; awarded_by: string }) => {
          const { data: actorProfile } = await this.supabase.client
            .from('profiles').select('full_name').eq('id', ev.awarded_by).single();
          return {
            id:          ev.id,
            type:        'xp_award',
            description: `Awarded +${ev.points} XP for "${ev.reason}"`,
            actor:       (actorProfile as { full_name: string } | null)?.full_name ?? 'Instructor',
            created_at:  ev.created_at,
          };
        }),
      );

      this.logs.set(events);
    } catch {
      // Non-critical
    } finally {
      this.isLoading.set(false);
    }
  }
}
