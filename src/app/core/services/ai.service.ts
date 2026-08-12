import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface AiRequestPayload {
  sessionContext?: {
    classId?: string;
    className?: string;
    ageGroup?: string;
    track?: string;
    sessionTitle?: string;
    durationMinutes?: number;
  };
  performanceData?: {
    totalStudents?: number;
    averageXp?: number;
    attendanceRate?: number;
  };
  prompt: string;
}

export interface AiStructuredResponse {
  title: string;
  objective: string;
  durationMinutes: number;
  instructions: string;
  gamificationSuggestion: string;
  xpReward: number;
  badgeSuggestion: string | null;
  challengeSuggestion: string | null;
  materials: string[];
  instructorSteps: string[];
  expectedStudentBehavior: string;
}

@Injectable({ providedIn: 'root' })
export class AIService {
  private readonly supabaseService = inject(SupabaseService);

  /**
   * Calls the secure Supabase Edge Function 'ai-gamification-assistant'
   */
  async getGamificationSuggestion(payload: AiRequestPayload): Promise<{ data: AiStructuredResponse | null; error: Error | null }> {
    try {
      const res = await this.supabaseService.client.functions.invoke('ai-gamification-assistant', {
        body: payload,
      });

      if (res.error) {
        console.warn('[AIService] Edge function call returned error or is not deployed yet. Using fallback recommendation:', res.error);
        return { data: this.generateClientFallback(payload), error: null };
      }

      if (res.data?.suggestion) {
        return { data: res.data.suggestion as AiStructuredResponse, error: null };
      }

      return { data: this.generateClientFallback(payload), error: null };
    } catch (err: any) {
      console.warn('[AIService] Network or Edge Function call exception (e.g. pre-deployment Failed to fetch). Returning fallback recommendation:', err);
      return { data: this.generateClientFallback(payload), error: null };
    }
  }

  /**
   * Applies suggestion as a new Challenge in Supabase after human instructor confirmation.
   */
  async applyAsChallenge(
    classId: string,
    title: string,
    description: string,
    xpReward: number,
    durationMinutes: number
  ): Promise<{ error: Error | null }> {
    const publicCode = `CHAL-${Date.now().toString(36).toUpperCase()}`;
    const { error } = await this.supabaseService.client.from('challenges').insert({
      public_code: publicCode,
      title: `[AI] ${title}`,
      description,
      xp_reward: xpReward,
      duration_minutes: durationMinutes,
      status: 'published',
      configuration: { created_by_ai: true, class_id: classId },
    });

    return { error: error as Error | null };
  }

  /**
   * Applies suggestion as batch XP bonus to students in Supabase after human instructor confirmation.
   */
  async applyAsXpBonus(
    classId: string,
    instructorId: string,
    points: number,
    reason: string
  ): Promise<{ error: Error | null }> {
    // 1. Fetch class students
    const { data: students, error: fetchErr } = await this.supabaseService.client
      .from('students')
      .select('id')
      .eq('class_id', classId);

    if (fetchErr || !students || students.length === 0) {
      return { error: fetchErr as Error | null };
    }

    // 2. Insert batch xp_events
    const xpInserts = students.map((std) => ({
      student_id: std.id,
      class_id: classId,
      awarded_by: instructorId,
      points,
      reason: `[AI Suggestion] ${reason}`,
      source_type: 'challenge',
    }));

    const { error: insertErr } = await this.supabaseService.client
      .from('xp_events')
      .insert(xpInserts);

    return { error: insertErr as Error | null };
  }

  private generateClientFallback(payload: AiRequestPayload): AiStructuredResponse {
    const promptLower = payload.prompt.toLowerCase();
    let title = "Speed Quest: Rapid Concept Sprint";
    let xp = 50;
    let suggestion = "Award +50 XP to pairs who finish the code challenge within 7 minutes.";

    if (promptLower.includes("motivate") || promptLower.includes("تحفيز") || promptLower.includes("engage")) {
      title = "Peer Mentorship & Help Boost";
      xp = 75;
      suggestion = "Activate 'Peer Helper' status: Students who assist a struggling teammate earn +75 XP and the Team Catalyst badge.";
    } else if (promptLower.includes("challenge") || promptLower.includes("تحدي") || promptLower.includes("quiz")) {
      title = "Algorithmic Duel: 3-Minute Lightning Round";
      xp = 100;
      suggestion = "Run a 3-minute quick fire round on key concepts. Top 3 solvers get +100 XP.";
    }

    return {
      title,
      objective: "Boost active participation and reinforce session core competencies.",
      durationMinutes: 10,
      instructions: "Divide students into dynamic pairs. Provide a clear 1-page objective checklist and timer on screen.",
      gamificationSuggestion: suggestion,
      xpReward: xp,
      badgeSuggestion: "Code Ninja",
      challengeSuggestion: "Weekly Sprint Challenge",
      materials: ["Live Timer HUD", "Concept Flashcards", "Shared Workspace Code"],
      instructorSteps: [
        "Explain rules in 60 seconds.",
        "Start 10-minute timer on Live Workspace HUD.",
        "Observe student pairs and award instant +25 XP bonus for creative solutions."
      ],
      expectedStudentBehavior: "High focus, collaborative peer discussions, and immediate active application of concepts."
    };
  }
}
