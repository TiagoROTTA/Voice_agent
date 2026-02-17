"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Marque le lead comme complété immédiatement après la fin de l'appel.
 * Permet à l'utilisateur de quitter la page tout de suite ; l'analyse tourne en arrière-plan.
 */
export async function markLeadCompleted(leadToken: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: "completed" })
    .eq("unique_token", leadToken);
  return error ? { error: error.message } : {};
}

/** Structured answers extracted by LLM from transcript (matches interview_logs.answers jsonb). */
export type InterviewAnswers = {
  question_1?: string;
  question_2?: string;
  question_3?: string;
  question_4?: string;
  question_5?: string;
  reason?: string;
  is_valid_persona?: boolean;
};

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000;
const MIN_TRANSCRIPT_LENGTH = 20;

/** Extrait le texte du transcript depuis la réponse 11Labs (transcript ou metadata.transcript). */
function extractTranscriptText(conv: Record<string, unknown>): string {
  let transcript = conv.transcript;
  if (transcript == null && typeof conv.metadata === "object" && conv.metadata !== null) {
    const meta = conv.metadata as Record<string, unknown>;
    transcript = meta.transcript;
  }
  if (Array.isArray(transcript)) {
    return transcript
      .map((t) => {
        const item = t as { role?: string; message?: string };
        return `${item.role ?? "unknown"}: ${item.message ?? ""}`.trim();
      })
      .filter(Boolean)
      .join("\n");
  }
  if (typeof transcript === "string") {
    return transcript.trim();
  }
  return "";
}

const PROCESS_SYSTEM_PROMPT = `You are a rigorous data analyst. Your job is to extract EXACT VERBATIM QUOTES from the transcript.
RULES:

NO SUMMARIZATION. You must extract the exact words spoken by the interviewee.

NO TRANSLATION. Keep the quotes in the original language of the speaker.

Map the quotes to the corresponding Question 1, 2, 3, and 4.

If the user ignores a question, return an empty string.

Evaluate is_valid: TRUE if the user took the interview seriously and answered the questions. FALSE if it's spam, empty, or nonsense.

OUTPUT JSON FORMAT:
{
  "is_valid": boolean,
  "reason": "Short explanation in English",
  "answers": {
    "q1": "Exact quote from user...",
    "q2": "Exact quote from user...",
    "q3": "Exact quote from user...",
    "q4": "Exact quote from user...",
    "q5": "Exact quote from user...(if any)"
  }
}`;

/**
 * Signal vs Noise: fetch transcript → analyze with LLM → save to interview_logs, lead completed.
 * Utilisé après la fin de l'appel.
 */
export async function processInterview(
  conversationId: string,
  leadToken: string
): Promise<{ error?: string }> {
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;

  // L'API 11Labs exige l'en-tête xi-api-key pour GET /v1/convai/conversations/{id}. Sans clé, pas de transcript.
  if (!elevenLabsKey?.trim()) {
    return { error: "ELEVENLABS_API_KEY is not set in .env.local. Add it to fetch the conversation transcript." };
  }

  // ——— 1. Fetch transcript from 11Labs (polling / retry loop) ———
  let transcriptText = "";
  const audioUrl = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio`;

  let lastRawResponse: Record<string, unknown> | null = null;

  {
    const url = `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`;
    const headers = { "xi-api-key": elevenLabsKey };

    for (let i = 0; i < MAX_RETRIES; i++) {
      console.log(`[processInterview] Attempt ${i + 1}/${MAX_RETRIES} Fetching transcript...`);

      const convRes = await fetch(url, { headers });
      if (!convRes.ok) {
        const err = await convRes.text();
        console.error(`[processInterview] Attempt ${i + 1} HTTP error:`, convRes.status, err.slice(0, 200));
        if (i === MAX_RETRIES - 1) {
          return { error: `11Labs conversation fetch failed: ${err.slice(0, 200)}` };
        }
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }

      const conv = (await convRes.json()) as Record<string, unknown>;
      lastRawResponse = conv;
      transcriptText = extractTranscriptText(conv);

      if (transcriptText.length > MIN_TRANSCRIPT_LENGTH) {
        console.log(`[processInterview] Transcript OK on attempt ${i + 1}, length=${transcriptText.length}`);
        break;
      }

      console.log("[processInterview] Transcript empty or too short, waiting...");
      if (i < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }
    }

    if (transcriptText.length <= MIN_TRANSCRIPT_LENGTH) {
      transcriptText = "(Transcript unavailable after retries)";
      console.warn("[processInterview] Transcript still empty after", MAX_RETRIES, "attempts. Last raw response:", JSON.stringify(lastRawResponse, null, 2).slice(0, 1500));
    }
  }

  // ——— Logs (visible dans le terminal Next.js, pas le navigateur) ———
  console.log("[processInterview] Transcript length:", transcriptText.length);
  console.log("[processInterview] Transcript preview:", transcriptText.slice(0, 500));

  // ——— 2. Analyze with OpenAI (Signal vs Noise) ———
  let isValid = true;
  let answers: InterviewAnswers = {};
  const answersObj: Record<string, string> = { q1: "", q2: "", q3: "", q4: "", q5: "" };
  let reason = "";

  if (openAiKey) {
    const analyzeRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: PROCESS_SYSTEM_PROMPT },
          { role: "user", content: transcriptText },
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
      }),
    });

    if (analyzeRes.ok) {
      const data = (await analyzeRes.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      console.log("[processInterview] OpenAI raw response:", content ?? "(empty)");
      if (content) {
        try {
          const parsed = JSON.parse(content) as Record<string, unknown>;
          console.log("[processInterview] OpenAI parsed:", JSON.stringify(parsed, null, 2));
          isValid =
            parsed.is_valid === true ||
            (typeof parsed.is_valid === "string" && /true|oui|valid/i.test(String(parsed.is_valid)));
          reason = typeof parsed.reason === "string" ? parsed.reason : "";
          const ans = parsed.answers as Record<string, unknown> | undefined;
          if (ans && typeof ans === "object") {
            answersObj.q1 = typeof ans.q1 === "string" ? ans.q1 : "";
            answersObj.q2 = typeof ans.q2 === "string" ? ans.q2 : "";
            answersObj.q3 = typeof ans.q3 === "string" ? ans.q3 : "";
            answersObj.q4 = typeof ans.q4 === "string" ? ans.q4 : "";
            answersObj.q5 = typeof ans.q5 === "string" ? ans.q5 : "";
          }
          console.log("[processInterview] Extracted: is_valid=", isValid, "reason=", reason.slice(0, 80), "q1..q5 lengths:", answersObj.q1.length, answersObj.q2.length, answersObj.q3.length, answersObj.q4.length, answersObj.q5.length);
        } catch (parseErr) {
          console.error("[processInterview] OpenAI JSON parse error:", parseErr);
          console.error("[processInterview] Raw content was:", content);
        }
      } else {
        console.warn("[processInterview] OpenAI response had no content");
      }
    } else {
      const errText = await analyzeRes.text();
      console.error("[processInterview] OpenAI request failed:", analyzeRes.status, errText.slice(0, 300));
    }
  }

  answers = {
    question_1: answersObj.q1,
    question_2: answersObj.q2,
    question_3: answersObj.q3,
    question_4: answersObj.q4,
    question_5: answersObj.q5 || undefined,
    reason: reason || undefined,
  };

  console.log("[processInterview] Saving to interview_logs:", { is_valid_persona: isValid, answers_keys: Object.keys(answers), question_1_preview: answers.question_1?.slice(0, 60) });

  // ——— 3. Save: interview_logs + lead status completed ———
  const supabase = await createClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id")
    .eq("unique_token", leadToken)
    .single();

  if (leadError || !lead) {
    return { error: "Lead not found." };
  }

  const { error: insertError } = await supabase.from("interview_logs").insert({
    lead_id: lead.id,
    transcript: transcriptText,
    audio_url: audioUrl,
    answers,
    is_valid_persona: isValid,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  await supabase
    .from("leads")
    .update({ status: "completed" })
    .eq("unique_token", leadToken);

  return {};
}
