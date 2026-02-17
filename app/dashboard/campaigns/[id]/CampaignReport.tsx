"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";

export type ReportRow = {
  question_1: string;
  question_2: string;
  question_3: string;
  question_4: string;
};

function escapeCsvCell(value: string): string {
  const s = String(value ?? "").replace(/"/g, '""');
  if (/[",\n\r]/.test(s)) return `"${s}"`;
  return s;
}

function buildCsv(rows: ReportRow[]): string {
  const headers = ["Question 1", "Question 2", "Question 3", "Question 4"];
  const headerLine = headers.map(escapeCsvCell).join(",");
  const dataLines = rows.map(
    (r) =>
      [
        escapeCsvCell(r.question_1),
        escapeCsvCell(r.question_2),
        escapeCsvCell(r.question_3),
        escapeCsvCell(r.question_4),
      ].join(",")
  );
  return [headerLine, ...dataLines].join("\r\n");
}

function downloadCsv(rows: ReportRow[], campaignTitle: string) {
  const csv = buildCsv(rows);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${campaignTitle.replace(/[^a-z0-9-_]/gi, "_")}_responses.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

type CampaignReportProps = {
  campaignTitle: string;
  rows: ReportRow[];
};

export function CampaignReport({ campaignTitle, rows }: CampaignReportProps) {
  const count = rows.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          <span className="font-medium text-black">{count}</span>{" "}
          {count === 1 ? "person has responded" : "people have responded"}
        </p>
        {count > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-300 w-fit"
            onClick={() => downloadCsv(rows, campaignTitle)}
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        )}
      </div>

      {count === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">
          No completed interviews yet. Responses will appear here once leads finish their calls.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-200 bg-zinc-50">
                <TableHead className="font-medium text-zinc-900">Question 1</TableHead>
                <TableHead className="font-medium text-zinc-900">Question 2</TableHead>
                <TableHead className="font-medium text-zinc-900">Question 3</TableHead>
                <TableHead className="font-medium text-zinc-900">Question 4</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i} className="border-zinc-200">
                  <TableCell className="max-w-[240px] whitespace-pre-wrap text-sm text-zinc-700">
                    {row.question_1 || "—"}
                  </TableCell>
                  <TableCell className="max-w-[240px] whitespace-pre-wrap text-sm text-zinc-700">
                    {row.question_2 || "—"}
                  </TableCell>
                  <TableCell className="max-w-[240px] whitespace-pre-wrap text-sm text-zinc-700">
                    {row.question_3 || "—"}
                  </TableCell>
                  <TableCell className="max-w-[240px] whitespace-pre-wrap text-sm text-zinc-700">
                    {row.question_4 || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
