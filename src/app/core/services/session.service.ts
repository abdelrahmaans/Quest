import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from '../auth/auth.service';
import type { GamificationModeId } from '../../features/instructor/sessions/sessions-list/sessions-list';

export interface CreateSessionDto {
  classId: string;
  title: string;
  description?: string | null;
  scheduledAt?: string | null;
  durationMinutes?: number;
  gamificationMode?: GamificationModeId;
}

export interface SessionSummary {
  id: string;
  title: string;
  className: string;
  durationMinutes: number;
  totalXpAwarded: number;
  presentCount: number;
  totalStudents: number;
  gamificationMode: GamificationModeId;
  mvpStudentName?: string | null;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth     = inject(AuthService);

  /**
   * Creates a new session for a class with auto-calculated session_number and gamification mode.
   */
  async createSession(dto: CreateSessionDto): Promise<{ data: any; error: Error | null }> {
    try {
      // 1. Calculate next session_number for this class
      const { count } = await this.supabase.client
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', dto.classId);

      const nextNum = (count ?? 0) + 1;

      const { data, error } = await this.supabase.client
        .from('sessions')
        .insert({
          class_id:          dto.classId,
          session_number:    nextNum,
          title:             dto.title.trim(),
          description:       dto.description?.trim() || null,
          started_at:        dto.scheduledAt ? new Date(dto.scheduledAt).toISOString() : null,
          duration_minutes:  dto.durationMinutes || 45,
          status:            dto.scheduledAt ? 'scheduled' : 'draft',
          gamification_mode: dto.gamificationMode || 'xp_levels',
        })
        .select('id, session_number, title, description, status, started_at, duration_minutes, gamification_mode, created_at')
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (e: unknown) {
      console.error('[SessionService] Error creating session:', e);
      return { data: null, error: e as Error };
    }
  }

  /**
   * Sets session status to 'live' and records started_at timestamp.
   */
  async launchSession(sessionId: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.client
        .from('sessions')
        .update({
          status: 'live',
          started_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
      return { error: null };
    } catch (e: unknown) {
      return { error: e as Error };
    }
  }

  /**
   * Completes a live session, calculates stats, records ended_at, and writes to audit_log.
   */
  async completeSession(sessionId: string, summary: Partial<SessionSummary>): Promise<{ error: Error | null }> {
    const user = this.auth.currentUser();

    try {
      const { error } = await this.supabase.client
        .from('sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Log session completion to audit_log
      if (user) {
        await this.supabase.client
          .from('audit_log')
          .insert({
            actor_id: user.id,
            action:   'COMPLETE_SESSION',
            entity:   'sessions',
            entity_id: sessionId,
            metadata: {
              title: summary.title,
              total_xp_awarded: summary.totalXpAwarded,
              present_count: summary.presentCount,
              gamification_mode: summary.gamificationMode,
              mvp: summary.mvpStudentName,
              completed_at: new Date().toISOString(),
            },
          });
      }

      return { error: null };
    } catch (e: unknown) {
      return { error: e as Error };
    }
  }

  /**
   * Records or updates attendance record for a student in a session.
   */
  async updateAttendance(sessionId: string, studentId: string, status: 'present' | 'absent' | 'late'): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.client
        .from('attendance')
        .upsert(
          {
            session_id: sessionId,
            student_id: studentId,
            status,
            recorded_at: new Date().toISOString(),
          },
          { onConflict: 'session_id, student_id' },
        );

      if (error) throw error;
      return { error: null };
    } catch (e: unknown) {
      return { error: e as Error };
    }
  }
}
