"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Lead = {
  id: string;
  raw_data: Record<string, unknown>;
  is_icp_match: boolean | null;
  match_reasoning: string | null;
  unique_token: string | null;
};

function getLeadName(raw: Record<string, unknown>): string {
  const keys = ["name", "Name", "full_name", "Full Name", "email", "Email", "contact"];
  for (const k of keys) {
    const v = raw[k];
    if (v != null && typeof v === "string" && v.trim()) return v.trim();
  }
  const first = Object.values(raw).find((v) => typeof v === "string" && String(v).trim());
  return first ? String(first).trim().slice(0, 50) : "—";
}

const baseUrl =
  typeof process.env.NEXT_PUBLIC_APP_URL === "string" &&
  process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
    : "";

type LeadListProps = {
  leads: Lead[];
  campaignId: string;
};

export function LeadList({ leads, campaignId }: LeadListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyLink = (token: string, id: string) => {
    const origin = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const url = `${origin}/interview/${token}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (!leads.length) {
    return (
      <p className="text-zinc-600">No leads yet. Upload a CSV to get started.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-zinc-200 hover:bg-transparent">
          <TableHead className="text-zinc-900">Name</TableHead>
          <TableHead className="text-zinc-900">Status</TableHead>
          <TableHead className="text-zinc-900">Reason</TableHead>
          <TableHead className="text-zinc-900 text-right">Interview Link</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {leads.map((lead) => {
          const name = getLeadName(lead.raw_data);
          const interviewUrl =
            lead.is_icp_match && lead.unique_token
              ? baseUrl
                ? `${baseUrl}/interview/${lead.unique_token}`
                : `/interview/${lead.unique_token}`
              : null;

          return (
            <TableRow
              key={lead.id}
              className="border-zinc-200 text-black"
            >
              <TableCell className="font-medium">{name}</TableCell>
              <TableCell>
                {lead.is_icp_match ? (
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
                    Match
                  </Badge>
                ) : (
                  <Badge variant="destructive">No Match</Badge>
                )}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-xs text-zinc-500">
                {lead.match_reasoning ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {interviewUrl ? (
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={interviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-black underline hover:no-underline"
                    >
                      Link
                      <ExternalLink className="size-3" />
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-600"
                      onClick={() => copyLink(lead.unique_token!, lead.id)}
                    >
                      {copiedId === lead.id ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <span className="text-zinc-400">—</span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
