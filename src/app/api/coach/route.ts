import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { classifyIntent, safeReply } from "@/lib/coach/intent";
import { OpenAIProvider, UnavailableProvider } from "@/lib/coach/provider";
import { validateAction } from "@/lib/coach/action-validator";
import { executeAction } from "@/lib/coach/actions";
import { EXERCISE_CATALOG } from "@/lib/workouts/catalog";
import type { WorkoutInput } from "@/lib/workouts/types";

function describeResult(result: ReturnType<typeof executeAction>): string {
  if (result.kind === "workout") {
    return "I've updated your workout plan based on that. Check your Home tab for the new session.";
  }
  if (result.kind === "alternatives") {
    if (result.exercises.length === 0) {
      return "I couldn't find a good alternative for that exercise right now.";
    }
    const names = result.exercises.map((x) => x.name).join(", ");
    return `Here are some alternatives: ${names}.`;
  }
  if (result.kind === "explanation") {
    return result.exercise.instructions ?? `${result.exercise.name}: no detailed instructions available.`;
  }
  return "Done.";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const message = body?.message;
  if (typeof message !== "string" || message.trim().length < 1 || message.length > 2000) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const s = createClient();
  const {
    data: { user },
  } = await s.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let conversationId = body?.conversationId;
  if (conversationId) {
    const { data } = await s
      .from("coach_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  } else {
    const { data, error } = await s.from("coach_conversations").insert({ user_id: user.id }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    conversationId = data.id;
  }

  await s.from("coach_messages").insert({ conversation_id: conversationId, role: "user", message: message.trim() });

  const intent = classifyIntent(message);
  const guarded = safeReply(intent);
  let reply = guarded;

  if (!reply) {
    // Check the AI usage limit before calling any provider
    const { data: canUse } = await s.rpc("can_use_ai");
    if (canUse === false) {
      reply = "You've reached today's coaching limit. Please try again tomorrow.";
    } else {
      try {
        const [{ data: profile }, { data: prefs }, { data: contra }] = await Promise.all([
          s.from("profiles").select("experience_level").eq("id", user.id).single(),
          s
            .from("training_preferences")
            .select("goal, equipment, workout_location, days_per_week, session_duration_minutes")
            .eq("user_id", user.id)
            .single(),
          s.from("contraindications").select("body_part, severity").eq("user_id", user.id),
        ]);

        if (!profile || !prefs) {
          reply = "Please complete onboarding before using the coach.";
        } else {
          const context: WorkoutInput = {
            goal: prefs.goal as WorkoutInput["goal"],
            experience: profile.experience_level as WorkoutInput["experience"],
            equipment: prefs.equipment,
            workout_location: prefs.workout_location as WorkoutInput["workout_location"],
            days_per_week: prefs.days_per_week,
            session_duration_minutes: prefs.session_duration_minutes,
            contraindications: contra ?? [],
          };

          const apiKey = process.env.OPENAI_API_KEY;
          if (!apiKey) throw new Error("AI provider is not configured");

          const provider = new OpenAIProvider(apiKey);
          const raw = await provider.respond({
            message,
            intent,
            context: { ...context, exercise_catalog: EXERCISE_CATALOG.map((e) => ({ id: e.id, name: e.name, movement_pattern: e.movement_pattern })) },
          });

          const structuredAction = validateAction({
            intent: raw.action?.params.intent ?? intent,
            action: raw.action?.type,
            parameters: raw.action?.params,
          });

          const result = executeAction(structuredAction, context);
          reply = describeResult(result);

          await s.rpc("record_ai_usage");
        }
      } catch {
        reply = "I couldn't process that right now. Please try again.";
      }
    }
  }

  await s.from("coach_messages").insert({ conversation_id: conversationId, role: "assistant", message: reply });

  return NextResponse.json({ conversationId, intent, message: reply });
}