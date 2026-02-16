import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function CampaignsPage() {
  const supabase = await createClient();
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, title, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight text-black">
          Campaigns
        </h1>
        <p className="text-red-600">Error loading campaigns: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-black">
          Campaigns
        </h1>
        <Button asChild className="w-full sm:w-auto bg-black text-white hover:bg-zinc-800">
          <Link href="/dashboard/campaigns/new" className="inline-flex items-center gap-2">
            <Plus className="size-4" />
            Create New Campaign
          </Link>
        </Button>
      </div>

      {!campaigns?.length ? (
        <p className="text-zinc-600">No campaigns yet. Create one to get started.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              <Link
                href={`/dashboard/campaigns/${campaign.id}`}
                className="flex items-center justify-between px-4 py-3 text-black hover:bg-zinc-50"
              >
                <span className="font-medium">{campaign.title}</span>
                <span className="text-sm text-zinc-500">
                  {campaign.created_at
                    ? new Date(campaign.created_at).toLocaleDateString()
                    : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
