"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { campaignSchema } from "@/lib/validations/campaign";

function formDataToObject(formData: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  formData.forEach((value, key) => {
    obj[key] = typeof value === "string" ? value : "";
  });
  return obj;
}

export async function createCampaign(
  formData: FormData
): Promise<{ errors?: Record<string, string> } | void> {
  const raw = formDataToObject(formData);
  const parsed = campaignSchema.safeParse(raw);

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.flatten().fieldErrors &&
      Object.entries(parsed.error.flatten().fieldErrors).forEach(
        ([k, v]) => (errors[k] = Array.isArray(v) ? v[0] ?? "" : v)
      );
    return { errors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").insert({
    title: parsed.data.title,
    hypothesis_pain: parsed.data.hypothesis_pain,
    hypothesis_job: parsed.data.hypothesis_job,
    target_icp_description: parsed.data.target_icp_description,
    question_1: parsed.data.question_1,
    question_2: parsed.data.question_2,
    question_3: parsed.data.question_3,
    question_4: parsed.data.question_4,
    question_5_open: parsed.data.question_5_open || null,
  });

  if (error) {
    return { errors: { _form: error.message } };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Mark lead as completed by unique token (public interview page). */
export async function completeInterview(uniqueToken: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .update({ status: "completed" })
    .eq("unique_token", uniqueToken)
    .select("id")
    .single();

  if (error) return { error: error.message };
  if (!data) return { error: "Lead not found." };
  return {};
}

/** Call OpenAI to check if a lead matches the ICP. Returns { match, reason }. If no API key, simulates match. */
async function evaluateLeadMatch(
  icpDescription: string,
  leadData: Record<string, unknown>
): Promise<{ match: boolean; reason: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { match: true, reason: "No API key configured – defaulting to match for testing." };
  }

  const prompt = `ICP: ${icpDescription}

Lead data (JSON):
${JSON.stringify(leadData)}

Is this lead a direct match for the ICP? Reply with a JSON object only: { "match": true or false, "reason": "short explanation" }`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 150,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { match: false, reason: `API error: ${err.slice(0, 100)}` };
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { match: false, reason: "No response from AI." };
    const parsed = JSON.parse(content) as { match?: boolean; reason?: string };
    return {
      match: Boolean(parsed.match),
      reason: typeof parsed.reason === "string" ? parsed.reason : "—",
    };
  } catch (e) {
    return {
      match: false,
      reason: e instanceof Error ? e.message : "Request failed.",
    };
  }
}

export async function processLeads(
  campaignId: string,
  leadsData: Record<string, unknown>[]
): Promise<{ error?: string } | void> {
  const supabase = await createClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, target_icp_description")
    .eq("id", campaignId)
    .single();

  if (campaignError || !campaign) {
    return { error: "Campaign not found." };
  }

  const icpDescription = campaign.target_icp_description ?? "";

  for (const lead of leadsData) {
    const { match, reason } = await evaluateLeadMatch(icpDescription, lead);
    await supabase.from("leads").insert({
      campaign_id: campaignId,
      raw_data: lead,
      is_icp_match: match,
      match_reasoning: reason,
      status: "pending",
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/campaigns/${campaignId}`);
}
