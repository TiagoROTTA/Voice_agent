"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export type LeadForExport = {
  id: string;
  raw_data: Record<string, unknown>;
  unique_token: string | null;
};

function escapeCsvCell(value: string): string {
  const s = String(value ?? "").replace(/"/g, '""');
  if (/[",\n\r]/.test(s)) return `"${s}"`;
  return s;
}

function getInterviewUrl(token: string): string {
  const base =
    typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
      : typeof window !== "undefined"
        ? window.location.origin
        : "";
  return base ? `${base}/interview/${token}` : `${typeof window !== "undefined" ? window.location.origin : ""}/interview/${token}`;
}

function buildLeadsCsv(leads: LeadForExport[]): string {
  if (leads.length === 0) return "interview_link\r\n";

  const allKeys = new Set<string>();
  for (const lead of leads) {
    if (lead.raw_data && typeof lead.raw_data === "object") {
      for (const k of Object.keys(lead.raw_data)) allKeys.add(k);
    }
  }
  const headers = [...Array.from(allKeys).sort(), "interview_link"];

  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = leads.map((lead) => {
    const raw = lead.raw_data ?? {};
    const values = headers.slice(0, -1).map((key) => {
      const v = raw[key];
      if (v == null) return "";
      return escapeCsvCell(typeof v === "string" ? v : String(v));
    });
    const link = lead.unique_token ? getInterviewUrl(lead.unique_token) : "";
    values.push(escapeCsvCell(link));
    return values.join(",");
  });

  return [headerLine, ...dataLines].join("\r\n");
}

function downloadLeadsCsv(leads: LeadForExport[], campaignTitle: string) {
  const csv = buildLeadsCsv(leads);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${campaignTitle.replace(/[^a-z0-9-_]/gi, "_")}_leads.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type ExportLeadsCsvButtonProps = {
  leads: LeadForExport[];
  campaignTitle: string;
};

export function ExportLeadsCsvButton({ leads, campaignTitle }: ExportLeadsCsvButtonProps) {
  if (leads.length === 0) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-zinc-300 w-fit"
      onClick={() => downloadLeadsCsv(leads, campaignTitle)}
    >
      <Download className="size-4" />
      Export validated leads (CSV)
    </Button>
  );
}
