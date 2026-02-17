import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InterviewUI } from "./InterviewUI";

function getLeadName(rawData: Record<string, unknown> | null): string {
  if (!rawData || typeof rawData !== "object") return "there";
  const keys = ["name", "Name", "full_name", "Full Name", "email", "Email"];
  for (const k of keys) {
    const v = rawData[k];
    if (v != null && typeof v === "string" && v.trim()) return v.trim();
  }
  const first = Object.values(rawData).find((v) => typeof v === "string" && String(v).trim());
  return first ? String(first).trim() : "there";
}

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, status, raw_data, campaign_id")
    .eq("unique_token", token)
    .single();

  if (leadError || !lead) {
    notFound();
  }

  if (lead.status === "completed") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="max-w-sm space-y-4 text-center">
          <h1 className="text-xl font-semibold text-black">
            Interview already completed
          </h1>
          <p className="text-zinc-600">
            Thank you. This interview has already been submitted.
          </p>
        </div>
      </div>
    );
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select(
      "hypothesis_pain, hypothesis_job, question_1, question_2, question_3, question_4"
    )
    .eq("id", lead.campaign_id)
    .single();

  if (campaignError || !campaign) {
    notFound();
  }

  const leadName = getLeadName(lead.raw_data as Record<string, unknown> | null);
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? "";

  const q1 = (campaign.question_1 ?? "").trim();
  const q2 = (campaign.question_2 ?? "").trim();
  const q3 = (campaign.question_3 ?? "").trim();
  const q4 = (campaign.question_4 ?? "").trim();
  const pain = (campaign.hypothesis_pain ?? "").trim();
  const job = (campaign.hypothesis_job ?? "").trim();

  // Script injecté dans l'agent : une seule variable à placer dans le prompt ElevenLabs.
  const interviewScript = [
    pain && `Contexte (hypothèse douleur) : ${pain}`,
    job && `Contexte (job to be fait) : ${job}`,
    `Tu parles à ${leadName || "l'interviewé(e)"}.`,
    "",
    "Tu DOIS poser ces 4 questions pendant l'entretien, dans l'ordre, de façon naturelle :",
    q1 && `1) ${q1}`,
    q2 && `2) ${q2}`,
    q3 && `3) ${q3}`,
    q4 && `4) ${q4}`,
  ]
    .filter(Boolean)
    .join("\n");

  const dynamicVariables: Record<string, string> = {
    lead_name: leadName,
    hypothesis_pain: pain,
    hypothesis_job: job,
    question_1: q1,
    question_2: q2,
    question_3: q3,
    question_4: q4,
    interview_script: interviewScript,
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-lg">
        <div className="py-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-black">
            Voice Interview
          </h1>
          <p className="mt-1 text-zinc-600">
            A short conversation to capture your feedback.
          </p>
        </div>
        <InterviewUI
          token={token}
          agentId={agentId}
          dynamicVariables={dynamicVariables}
        />
      </main>
    </div>
  );
}
