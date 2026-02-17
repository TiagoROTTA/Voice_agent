import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { CsvUploader } from "./CsvUploader";
import { LeadList } from "./LeadList";
import { CampaignReport } from "./CampaignReport";
import { ExportLeadsCsvButton } from "./ExportLeadsCsvButton";
import type { ReportRow } from "./CampaignReport";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select(
      "id, title, hypothesis_pain, hypothesis_job, target_icp_description, created_at"
    )
    .eq("id", id)
    .single();

  if (campaignError || !campaign) {
    notFound();
  }

  const { data: leads } = await supabase
    .from("leads")
    .select("id, raw_data, is_icp_match, match_reasoning, unique_token")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false });

  const { data: completedLeadIds } = await supabase
    .from("leads")
    .select("id")
    .eq("campaign_id", id)
    .eq("status", "completed");

  const leadIds = (completedLeadIds ?? []).map((l) => l.id);
  let reportRows: ReportRow[] = [];
  if (leadIds.length > 0) {
    const { data: logs } = await supabase
      .from("interview_logs")
      .select("answers")
      .in("lead_id", leadIds)
      .order("created_at", { ascending: false });
    const answers = (logs ?? []) as { answers?: Record<string, unknown> }[];
    reportRows = answers.map((log) => {
      const a = log.answers ?? {};
      return {
        question_1: typeof a.question_1 === "string" ? a.question_1 : "",
        question_2: typeof a.question_2 === "string" ? a.question_2 : "",
        question_3: typeof a.question_3 === "string" ? a.question_3 : "",
        question_4: typeof a.question_4 === "string" ? a.question_4 : "",
      };
    });
  }

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild className="text-zinc-600">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="size-4" />
          Back to campaigns
        </Link>
      </Button>

      {/* Section 1: Header & Info (Read-Only) */}
      <Card className="border-zinc-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-black">{campaign.title}</CardTitle>
          {campaign.created_at && (
            <p className="text-sm text-zinc-500">
              Created{" "}
              {new Date(campaign.created_at).toLocaleDateString()}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-900">
              Pain Point
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              {campaign.hypothesis_pain ?? "—"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-900">
              Job to be Done
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              {campaign.hypothesis_job ?? "—"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-900">
              ICP Description
            </h3>
            <p className="mt-1 text-sm text-zinc-600">
              {campaign.target_icp_description ?? "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Upload CSV */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-black">Upload leads</h2>
        <p className="text-sm text-zinc-600">
          Upload a CSV file. Each row will be evaluated against the ICP above.
          Matching leads will get a unique interview link.
        </p>
        <CsvUploader campaignId={id} />
      </div>

      {/* Section 3: Campaign Report (responses) */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-black">Campaign report</h2>
        <CampaignReport campaignTitle={campaign.title ?? "Campaign"} rows={reportRows} />
      </div>

      {/* Section 4: Lead List Table */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-medium text-black">Leads</h2>
          <ExportLeadsCsvButton
            leads={(leads ?? []).filter((l) => l.is_icp_match === true)}
            campaignTitle={campaign.title ?? "Campaign"}
          />
        </div>
        <div className="rounded-md border border-zinc-200 bg-white">
          <LeadList leads={leads ?? []} campaignId={id} />
        </div>
      </div>
    </div>
  );
}
