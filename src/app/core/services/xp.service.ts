import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from '../auth/auth.service';

export interface AwardXpPayload {
  studentId: string;
  classId?: string | null;
  sessionId?: string | null;
  points: number;
  sourceType: string; // 'manual' | 'live_session' | 'challenge' | 'attendance' | etc.
  reason: string;
  metadata?: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class XpService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth     = inject(AuthService);

  /**
   * Centralized method to award XP to a single student.
   * Inserts into xp_events using exact schema column names:
   * (student_id, class_id, session_id, source_type, points, reason, metadata, created_by)
   */
  async awardXp(payload: AwardXpPayload): Promise<{ error: Error | null }> {
    const user = this.auth.currentUser();

    try {
      // 1. Insert into xp_events ledger
      const { error: insertError } = await this.supabase.client
        .from('xp_events')
        .insert({
          student_id:  payload.studentId,
          class_id:    payload.classId ?? null,
          session_id:  payload.sessionId ?? null,
          source_type: payload.sourceType || 'manual',
          points:      payload.points,
          reason:      payload.reason,
          metadata:    payload.metadata ?? {},
          created_by:  user?.id ?? null,
        });

      if (insertError) throw insertError;

      // 2. Increment student's cumulative xp_total in students table
      const { data: studentData } = await this.supabase.client
        .from('students')
        .select('xp_total')
        .eq('id', payload.studentId)
        .single();

      if (studentData) {
        const newTotal = (studentData.xp_total ?? 0) + payload.points;
        await this.supabase.client
          .from('students')
          .update({ xp_total: newTotal })
          .eq('id', payload.studentId);
      }

      return { error: null };
    } catch (e: unknown) {
      console.error('[XpService] Error awarding XP:', e);
      return { error: e as Error };
    }
  }

  /**
   * Centralized method to award XP to multiple students at once.
   */
  async awardBatchXp(payloads: AwardXpPayload[]): Promise<{ error: Error | null }> {
    if (payloads.length === 0) return { error: null };
    const user = this.auth.currentUser();

    try {
      const inserts = payloads.map(p => ({
        student_id:  p.studentId,
        class_id:    p.classId ?? null,
        session_id:  p.sessionId ?? null,
        source_type: p.sourceType || 'manual',
        points:      p.points,
        reason:      p.reason,
        metadata:    p.metadata ?? {},
        created_by:  user?.id ?? null,
      }));

      const { error: insertError } = await this.supabase.client
        .from('xp_events')
        .insert(inserts);

      if (insertError) throw insertError;

      // Increment student totals asynchronously
      await Promise.all(
        payloads.map(async p => {
          const { data: s } = await this.supabase.client
            .from('students')
            .select('xp_total')
            .eq('id', p.studentId)
            .single();

          if (s) {
            const newTotal = (s.xp_total ?? 0) + p.points;
            await this.supabase.client
              .from('students')
              .update({ xp_total: newTotal })
              .eq('id', p.studentId);
          }
        }),
      );

      return { error: null };
    } catch (e: unknown) {
      console.error('[XpService] Error awarding batch XP:', e);
      return { error: e as Error };
    }
  }
}
