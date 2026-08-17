import type { StructuredAction } from "./actions";

export type ProviderReply = { message: string; action?: { type: string; params: Record<string, unknown> } };

export interface AIProvider {
  respond(input: { message: string; intent: string; context: Record<string, unknown> }): Promise<ProviderReply>;
}

export class UnavailableProvider implements AIProvider {
  async respond(_input: { message: string; intent: string; context: Record<string, unknown> }): Promise<ProviderReply> {
    throw new Error("AI provider is not configured");
  }
}

const SYSTEM_PROMPT = `You are a fitness coach assistant. Given a user's message and their current
training context, respond with ONLY a JSON object (no prose, no markdown fences) matching this shape:

{
  "intent": string,
  "action": "modify_workout_duration" | "substitute_exercise" | "adjust_difficulty" | "explain_exercise",
  "parameters": { ... }
}

Rules per action:
- modify_workout_duration: parameters.duration_minutes must be one of 20, 30, 45, 60, 90.
- substitute_exercise: parameters.exercise_id must be a real exercise id from the provided catalog.
- adjust_difficulty: parameters.direction must be "easier" or "harder".
- explain_exercise: parameters.exercise_id must be a real exercise id from the provided catalog.

If the user's request doesn't clearly map to one of these four actions, pick the closest reasonable one.
Never include commentary outside the JSON object.`;

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "gpt-4o-mini") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async respond(input: { message: string; intent: string; context: Record<string, unknown> }): Promise<ProviderReply> {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              message: input.message,
              classified_intent: input.intent,
              context: input.context,
            }),
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`OpenAI request failed: ${res.status} ${errText}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("OpenAI returned no content");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("OpenAI returned invalid JSON");
    }

    const action = parsed as StructuredAction;
    return {
      message: "",
      action: { type: action.action, params: { intent: action.intent, ...action.parameters } },
    };
  }
}