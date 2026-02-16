import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { CsvUploader } from "./CsvUploader";
import { LeadList } from "./LeadList";

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

      {/* Section 3: Lead List Table */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-black">Leads</h2>
        <div className="rounded-md border border-zinc-200 bg-white">
          <LeadList leads={leads ?? []} campaignId={id} />
        </div>
      </div>
    </div>
  );
}
