import { Component, inject, signal, OnInit } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { IconComponent } from '../../../shared/ui/icon/icon';

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  actor_name?: string;
}

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [DatePipe, UpperCasePipe, IconComponent],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.css',
})
export class AdminAuditLogsComponent implements OnInit {
  readonly supabase = inject(SupabaseService);

  readonly isLoading = signal(true);
  readonly logs      = signal<AuditLogRow[]>([]);
  readonly errorMsg  = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadAuditLogs();
  }

  async loadAuditLogs(): Promise<void> {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    try {
      // Query official audit_log table with profiles join for actor name
      const { data, error } = await this.supabase.client
        .from('audit_log')
        .select('id, actor_id, action, entity, entity_id, metadata, created_at, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedLogs: AuditLogRow[] = (data ?? []).map((row: any) => ({
        id:          row.id,
        actor_id:    row.actor_id,
        action:      row.action,
        entity:      row.entity,
        entity_id:   row.entity_id,
        metadata:    row.metadata ?? {},
        created_at:  row.created_at,
        actor_name:  row.profiles?.full_name ?? 'System',
      }));

      this.logs.set(formattedLogs);
    } catch (err: unknown) {
      console.error('[AdminAuditLogs] Error querying audit_log:', err);
      this.errorMsg.set((err as Error).message || 'Failed to load audit logs.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
