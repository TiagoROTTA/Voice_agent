"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Loader2, Upload } from "lucide-react";
import { processLeads } from "@/app/dashboard/actions";

type CsvUploaderProps = {
  campaignId: string;
  onDone?: () => void;
};

export function CsvUploader({ campaignId, onDone }: CsvUploaderProps) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("Please upload a .csv file.");
        return;
      }
      setError(null);
      setIsProcessing(true);
      return new Promise<void>((resolve) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            const rows = results.data as Record<string, unknown>[];
            if (!rows.length) {
              setError("The CSV file is empty or has no valid rows.");
              setIsProcessing(false);
              resolve();
              return;
            }
            try {
              await processLeads(campaignId, rows);
              router.refresh();
              onDone?.();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Processing failed.");
            } finally {
              setIsProcessing(false);
              resolve();
            }
          },
          error: (err) => {
            setError(err.message ?? "Failed to parse CSV.");
            setIsProcessing(false);
            resolve();
          },
        });
      });
    },
    [campaignId, router, onDone]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile]
  );

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
          isDragging ? "border-black bg-zinc-50" : "border-zinc-300 bg-white"
        } ${isProcessing ? "pointer-events-none opacity-70" : ""}`}
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleChange}
          disabled={isProcessing}
          className="hidden"
          id="csv-upload"
        />
        <label htmlFor="csv-upload" className="flex cursor-pointer flex-col items-center gap-2">
          {isProcessing ? (
            <>
              <Loader2 className="size-8 animate-spin text-zinc-600" />
              <span className="text-sm text-zinc-600">Processing leads…</span>
            </>
          ) : (
            <>
              <Upload className="size-8 text-zinc-500" />
              <span className="text-sm font-medium text-black">
                Drop a CSV file here or click to upload
              </span>
              <span className="text-xs text-zinc-500">.csv only</span>
            </>
          )}
        </label>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
