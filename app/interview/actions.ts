"use server";

import { createClient } from "@/lib/supabase/server";

export type StructuredAnswers = {
  q1?: string;
  q2?: string;
  q3?: string;
  q4?: string;
  is_valid_persona?: "Valid" | "Invalid";
};

/**
 * Fetch transcript and audio URL from 11Labs API, analyze with OpenAI, save to interview_logs.
 */
export async function saveAndAnalyzeInterview(
  conversationId: string,
  leadToken: string
): Promise<{ error?: string }> {
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!elevenLabsKey) {
    return { error: "ELEVENLABS_API_KEY not configured." };
  }
  if (!openaiKey) {
    return { error: "OPENAI_API_KEY not configured." };
  }

  const supabase = await createClient();

  // Resolve lead by token
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, campaign_id")
    .eq("unique_token", leadToken)
    .single();

  if (leadError || !lead) {
    return { error: "Lead not found." };
  }

  // --- Step A: Fetch from 11Labs ---
  const baseUrl = process.env.ELEVENLABS_API_BASE_URL ?? "https://api.elevenlabs.io";
  const convRes = await fetch(
    `${baseUrl}/v1/convai/conversations/${conversationId}`,
    {
      headers: {
        "xi-api-key": elevenLabsKey,
        "Content-Type": "application/json",
      },
    }
  );

  if (!convRes.ok) {
    const errText = await convRes.text();
    return {
      error: `11Labs API error (${convRes.status}): ${errText.slice(0, 200)}`,
    };
  }

  const convData = (await convRes.json()) as Record<string, unknown>;
  const transcript = extractTranscript(convData);
  const audioUrl = extractAudioUrl(convData);

  if (!transcript || transcript.trim().length === 0) {
    return { error: "No transcript available from 11Labs." };
  }

  // --- Step B: Analyze with OpenAI ---
  const systemPrompt = `Tu es un analyste de données. Extrais les réponses aux questions Q1, Q2, Q3, Q4 de ce transcript.
Détermine aussi si la personne correspondait bien à la cible (Valid/Invalid).
Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après.
Format attendu :
{
  "q1": "réponse à la question 1",
  "q2": "réponse à la question 2",
  "q3": "réponse à la question 3",
  "q4": "réponse à la question 4",
  "is_valid_persona": "Valid" ou "Invalid"
}`;

  const analyzeRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
    }),
  });

  if (!analyzeRes.ok) {
    const errText = await analyzeRes.text();
    return {
      error: `OpenAI API error (${analyzeRes.status}): ${errText.slice(0, 200)}`,
    };
  }

  const analyzeJson = (await analyzeRes.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = analyzeJson.choices?.[0]?.message?.content;
  if (!content) {
    return { error: "No analysis response from OpenAI." };
  }

  let structuredAnswers: StructuredAnswers;
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    structuredAnswers = {
      q1: typeof parsed.q1 === "string" ? parsed.q1 : undefined,
      q2: typeof parsed.q2 === "string" ? parsed.q2 : undefined,
      q3: typeof parsed.q3 === "string" ? parsed.q3 : undefined,
      q4: typeof parsed.q4 === "string" ? parsed.q4 : undefined,
      is_valid_persona:
        parsed.is_valid_persona === "Valid"
          ? "Valid"
          : parsed.is_valid_persona === "Invalid"
            ? "Invalid"
            : undefined,
    };
  } catch {
    return { error: "Invalid JSON from OpenAI analysis." };
  }

  const is_valid_persona =
    structuredAnswers.is_valid_persona === "Valid";

  // --- Step C: Save to interview_logs and update lead ---
  const { error: insertError } = await supabase.from("interview_logs").insert({
    lead_id: lead.id,
    conversation_id: conversationId,
    transcript,
    audio_url: audioUrl || null,
    structured_answers: structuredAnswers,
    is_valid_persona,
  });

  if (insertError) {
    return { error: `Failed to save interview: ${insertError.message}` };
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({ status: "completed" })
    .eq("unique_token", leadToken);

  if (updateError) {
    return { error: `Failed to update lead status: ${updateError.message}` };
  }

  return {};
}

function extractTranscript(data: Record<string, unknown>): string {
  if (typeof data.transcript === "string" && data.transcript.trim()) {
    return data.transcript.trim();
  }
  const messages = data.messages as Array<{ role?: string; content?: string }> | undefined;
  if (Array.isArray(messages) && messages.length > 0) {
    return messages
      .map((m) => (typeof m?.content === "string" ? m.content : ""))
      .filter(Boolean)
      .join("\n");
  }
  const history = data.history as Array<{ role?: string; text?: string; content?: string }> | undefined;
  if (Array.isArray(history) && history.length > 0) {
    return history
      .map((h) => (typeof h?.text === "string" ? h.text : typeof h?.content === "string" ? h.content : ""))
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function extractAudioUrl(data: Record<string, unknown>): string | null {
  const url = data.recording_url ?? data.audio_url ?? data.audio_url_mp3;
  return typeof url === "string" ? url : null;
}
