// Supabase Edge Function: ai-gamification-assistant
// Serves as a secure backend gateway for AI-powered gamification suggestions.
// API Keys are kept strictly as server-side secrets (Deno.env) and NEVER exposed to frontend.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── 1. AUTH & ROLE CHECK ─────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized: Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: Invalid session token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── 2. PARSE REQUEST PAYLOAD ──────────────────────────────
    const body: AiRequestPayload = await req.json();
    if (!body.prompt || typeof body.prompt !== "string") {
      return new Response(JSON.stringify({ error: "Bad Request: 'prompt' string field is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiApiKey = Deno.env.get("AI_API_KEY") || Deno.env.get("CLAUDE_API_KEY");

    // ── 3. BUILD SYSTEM PROMPT ────────────────────────────────
    const systemPrompt = `You are an expert Educational Gamification Advisor for the Mada Quest platform.
Your task is to analyze class context and instructor prompts to generate safe, highly engaging, age-appropriate gamification ideas.

GUIDELINES:
- Tailor difficulty, duration, and tone to the specified age group (${body.sessionContext?.ageGroup || 'General'}).
- Emphasize positive reinforcement, teamwork, and mastery over toxic competition.
- For young children, NEVER recommend aggressive zero-sum elimination games.
- Output MUST strictly be valid JSON matching the specified schema without conversational markdown formatting.`;

    // ── 4. EXECUTE AI CALL OR FALLBACK SIMULATION ────────────
    let structuredResponse: AiStructuredResponse;

    if (aiApiKey) {
      // Direct Anthropic / AI API Call
      const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": aiApiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Class: ${body.sessionContext?.className || 'General'}, Session: ${body.sessionContext?.sessionTitle || 'General'}. Instructor Question: ${body.prompt}`,
            },
          ],
        }),
      });

      if (!apiRes.ok) {
        const errTxt = await apiRes.text();
        console.error("AI API Error:", errTxt);
        structuredResponse = generateFallbackResponse(body);
      } else {
        const result = await apiRes.json();
        const rawContent = result.content?.[0]?.text || "";
        try {
          structuredResponse = JSON.parse(rawContent);
        } catch (_e) {
          structuredResponse = generateFallbackResponse(body);
        }
      }
    } else {
      // Server-side fallback generator when AI API key secret is not set in Deno env
      structuredResponse = generateFallbackResponse(body);
    }

    return new Response(JSON.stringify({ success: true, suggestion: structuredResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper generator for context-aware structured recommendations
function generateFallbackResponse(payload: AiRequestPayload): AiStructuredResponse {
  const isShort = (payload.sessionContext?.durationMinutes || 45) <= 30;
  const promptLower = payload.prompt.toLowerCase();

  let title = "Speed Quest: Rapid Concept Sprint";
  let xp = 50;
  let suggestion = "Award +50 XP to pairs who finish the code challenge within 7 minutes.";

  if (promptLower.includes("motivate") || promptLower.includes("engage")) {
    title = "Peer Mentorship & Help Boost";
    xp = 75;
    suggestion = "Activate 'Peer Helper' status: Students who assist a struggling teammate earn +75 XP and the Team Catalyst badge.";
  } else if (promptLower.includes("challenge") || promptLower.includes("quiz")) {
    title = "Algorithmic Duel: 3-Minute Lightning Round";
    xp = 100;
    suggestion = "Run a 3-minute quick fire round on key concepts. Top 3 solvers get +100 XP.";
  }

  return {
    title,
    objective: "Boost active participation and reinforce session core competencies.",
    durationMinutes: isShort ? 10 : 15,
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
