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

export interface AutoGenerateScheduleDto {
  classId: string;
  className: string;
  startDate: string;         // YYYY-MM-DD
  scheduleDays: string[];    // e.g. ['Sunday', 'Tuesday']
  scheduleTime: string;      // e.g. '16:00'
  totalSessions: number;     // e.g. 8
  defaultGamificationMode?: GamificationModeId;
  durationMinutes?: number;
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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth     = inject(AuthService);

  /**
   * Creates a single session for a class with auto-calculated session_number.
   */
  async createSession(dto: CreateSessionDto): Promise<{ data: any; error: Error | null }> {
    try {
      const { count } = await this.supabase.client
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', dto.classId);

      const nextNum = (count ?? 0) + 1;
      const scheduledIso = dto.scheduledAt ? new Date(dto.scheduledAt).toISOString() : null;

      const { data, error } = await this.supabase.client
        .from('sessions')
        .insert({
          class_id:          dto.classId,
          session_number:    nextNum,
          title:             dto.title.trim(),
          description:       dto.description?.trim() || null,
          scheduled_at:      scheduledIso,
          started_at:        scheduledIso,
          duration_minutes:  dto.durationMinutes || 45,
          status:            dto.scheduledAt ? 'scheduled' : 'draft',
          gamification_mode: dto.gamificationMode || 'xp_levels',
        })
        .select('id, session_number, title, description, status, scheduled_at, started_at, duration_minutes, gamification_mode, created_at')
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (e: unknown) {
      console.error('[SessionService] Error creating session:', e);
      return { data: null, error: e as Error };
    }
  }

  /**
   * Automatically calculates and generates a full series of sessions based on start date and weekly days.
   */
  async autoGenerateClassSessions(dto: AutoGenerateScheduleDto): Promise<{ count: number; error: Error | null }> {
    try {
      const { classId, className, startDate, scheduleDays, scheduleTime, totalSessions } = dto;
      const gMode = dto.defaultGamificationMode || 'xp_levels';
      const duration = dto.durationMinutes || 45;

      if (!scheduleDays || scheduleDays.length === 0 || totalSessions <= 0) {
        return { count: 0, error: new Error('Please select at least one schedule day.') };
      }

      // Convert day names to day indexes (0 for Sunday, 1 for Monday...)
      const targetDayIndexes = new Set(scheduleDays.map(d => DAY_NAMES.indexOf(d)).filter(idx => idx >= 0));

      const [hoursStr, minsStr] = (scheduleTime || '16:00').split(':');
      const hours = parseInt(hoursStr, 10) || 16;
      const mins = parseInt(minsStr, 10) || 0;

      const sessionsToInsert: any[] = [];
      let currentDate = new Date(startDate || new Date().toISOString().split('T')[0]);
      let sessionIndex = 1;

      // Loop up to 180 days ahead to find all match dates
      let safetyCounter = 0;
      while (sessionsToInsert.length < totalSessions && safetyCounter < 365) {
        const dayOfWeek = currentDate.getDay();
        if (targetDayIndexes.has(dayOfWeek)) {
          const sessionDateTime = new Date(currentDate);
          sessionDateTime.setHours(hours, mins, 0, 0);

          sessionsToInsert.push({
            class_id:          classId,
            session_number:    sessionIndex,
            title:             `Session #${sessionIndex}`,
            description:       `${className} — ${DAY_NAMES[dayOfWeek]} at ${scheduleTime || '16:00'}`,
            scheduled_at:      sessionDateTime.toISOString(),
            started_at:        sessionDateTime.toISOString(),
            duration_minutes:  duration,
            status:            'scheduled',
            gamification_mode: gMode,
          });

          sessionIndex++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
        safetyCounter++;
      }

      if (sessionsToInsert.length > 0) {
        const { error } = await this.supabase.client
          .from('sessions')
          .insert(sessionsToInsert);

        if (error) throw error;
      }

      return { count: sessionsToInsert.length, error: null };
    } catch (e: unknown) {
      console.error('[SessionService] Error auto-generating sessions:', e);
      return { count: 0, error: e as Error };
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
