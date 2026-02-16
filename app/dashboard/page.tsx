import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-black">
          Dashboard
        </h1>
        <p className="text-zinc-600">
          Manage your campaigns and view results.
        </p>
      </div>
      <div>
        <Button
          asChild
          className="bg-black text-white hover:bg-zinc-800"
        >
          <Link href="/dashboard/campaigns/new" className="inline-flex items-center gap-2">
            <Plus className="size-4" />
            Create New Campaign
          </Link>
        </Button>
      </div>
    </div>
  );
}
