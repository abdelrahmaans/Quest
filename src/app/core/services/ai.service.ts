import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { XpService } from './xp.service';

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
  private readonly xpService       = inject(XpService);

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
    const user = (await this.supabaseService.client.auth.getUser()).data.user;

    const { error } = await this.supabaseService.client.from('challenges').insert({
      public_code: publicCode,
      title: `[AI] ${title}`,
      description,
      xp_reward: xpReward,
      duration_minutes: durationMinutes,
      status: 'published',
      configuration: { class_id: classId },
      created_by: user?.id ?? null,
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

    // 2. Award batch XP using centralized XpService
    const batchPayloads = students.map((std) => ({
      studentId:  std.id,
      classId:    classId,
      points,
      reason:      `[AI Suggestion] ${reason}`,
      sourceType: 'challenge',
    }));

    return await this.xpService.awardBatchXp(batchPayloads);
  }

  private generateClientFallback(payload: AiRequestPayload): AiStructuredResponse {
    const promptLower = payload.prompt.toLowerCase();
    const cName = payload.sessionContext?.className || 'Class';
    const sTitle = payload.sessionContext?.sessionTitle || 'Session';

    if (promptLower.includes("motivate") || promptLower.includes("تحفيز") || promptLower.includes("engage") || promptLower.includes("حماس")) {
      return {
        title: "Peer Mentorship & Momentum Booster",
        objective: `Rekindle enthusiasm and active collaboration in ${cName}.`,
        durationMinutes: 10,
        instructions: "Pair advanced students with peers seeking guidance. Reward both students upon completing the checkpoint mini-task.",
        gamificationSuggestion: "Activate 'Team Catalyst' status: Students who assist a teammate unlock +75 XP and the Collaboration Spark badge.",
        xpReward: 75,
        badgeSuggestion: "Team Champion",
        challengeSuggestion: "Peer Assist Quest",
        materials: ["Live Timer HUD", "Checkpoint Checklist", "Pair Work Arena"],
        instructorSteps: [
          "Explain the peer-coaching concept in 60 seconds.",
          "Set a 10-minute timer on the Live Workspace HUD.",
          "Award instant +25 XP bonuses when observing constructive peer feedback."
        ],
        expectedStudentBehavior: "Empathetic communication, increased participation from hesitant learners, and lively team spirit."
      };
    } else if (promptLower.includes("drop") || promptLower.includes("هبوط") || promptLower.includes("تراجع") || promptLower.includes("why")) {
      return {
        title: "Micro-Sprint Engagement Diagnostic",
        objective: "Identify student friction points through an interactive 5-minute gamified survey.",
        durationMinutes: 7,
        instructions: "Launch a 3-question rapid-response challenge. Have students vote or submit quick code snippets.",
        gamificationSuggestion: "Award +40 XP for honest feedback and quick code test submissions.",
        xpReward: 40,
        badgeSuggestion: "Creative Spark",
        challengeSuggestion: "Rapid Diagnostic Sprint",
        materials: ["Interactive Quiz Poll", "Code Sandbox", "Live Feed HUD"],
        instructorSteps: [
          "Acknowledge the challenging topic openly with empathy.",
          "Run a 3-minute lightning poll to gauge comprehension.",
          "Pivot to a hands-on live coding game based on responses."
        ],
        expectedStudentBehavior: "Open reflection, reduced cognitive overload, and active re-engagement."
      };
    } else if (promptLower.includes("scratch") || promptLower.includes("blocks") || promptLower.includes("9") || promptLower.includes("طفل")) {
      return {
        title: "Scratch Animation & Sprite Duel",
        objective: "Master event broadcasting and variable controls in a fast-paced creative build.",
        durationMinutes: 10,
        instructions: "Create a sprite that moves and plays sound when clicked, then broadcasts a message to transform a second sprite.",
        gamificationSuggestion: "First 5 students to trigger the multi-sprite reaction earn +100 XP and the Speed Demon badge.",
        xpReward: 100,
        badgeSuggestion: "Code Ninja",
        challengeSuggestion: "Sprite Broadcast Blitz",
        materials: ["Scratch 3.0 Workspace", "Asset Sound Library", "Live HUD Timer"],
        instructorSteps: [
          "Demonstrate the 'when this sprite clicked' block.",
          "Start the 10-minute countdown challenge.",
          "Project student creations live on screen and award +50 XP bonuses."
        ],
        expectedStudentBehavior: "High excitement, rapid block snapping, and creative sound/animation experimentation."
      };
    } else {
      return {
        title: `Dynamic Concept Sprint: ${sTitle}`,
        objective: `Reinforce core skills and mastery in ${cName} through practical application.`,
        durationMinutes: 10,
        instructions: "Present a practical coding puzzle. Have students solve it individually or in duels.",
        gamificationSuggestion: "Award +50 XP to all students who submit working code before time runs out.",
        xpReward: 50,
        badgeSuggestion: "Bug Hunter",
        challengeSuggestion: "Live Lightning Round",
        materials: ["Live Workspace Timer", "Challenge Editor", "XP Console"],
        instructorSteps: [
          "Display the problem prompt on the projector/screen.",
          "Start the 10-minute timer in the HUD.",
          "Review answers live and award instant XP via the Quick Console."
        ],
        expectedStudentBehavior: "Focused problem-solving, test execution, and competitive drive."
      };
    }
  }
}
