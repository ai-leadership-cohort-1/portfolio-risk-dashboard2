"use client";

import { useRef, useState } from "react";

interface UploadPanelProps {
  onAnalyse: (pdfFile: File | null, csvFile: File | null) => void;
  onLoadSample: () => void;
  isProcessing: boolean;
  errorMessage: string | null;
}

export default function UploadPanel({
  onAnalyse,
  onLoadSample,
  isProcessing,
  errorMessage,
}: UploadPanelProps) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const canAnalyse = pdfFile !== null && csvFile !== null && !isProcessing;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          Portfolio Risk Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-[var(--muted)]">
          Upload your lending policy document and customer portfolio to generate
          an executive risk analysis. All processing happens locally in your
          browser — no data leaves this device.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => pdfInputRef.current?.click()}
            className="flex flex-col items-start rounded-lg border border-dashed border-[var(--border)] p-4 text-left transition-colors hover:border-[var(--accent)] hover:bg-[#f2f6fa]"
          >
            <span className="text-sm font-medium text-[var(--foreground)]">
              1. Lending Policy (PDF)
            </span>
            <span className="mt-1 text-xs text-[var(--muted)]">
              {pdfFile ? pdfFile.name : "Click to choose a .pdf file"}
            </span>
          </button>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
          />

          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            className="flex flex-col items-start rounded-lg border border-dashed border-[var(--border)] p-4 text-left transition-colors hover:border-[var(--accent)] hover:bg-[#f2f6fa]"
          >
            <span className="text-sm font-medium text-[var(--foreground)]">
              2. Customer Portfolio (CSV)
            </span>
            <span className="mt-1 text-xs text-[var(--muted)]">
              {csvFile ? csvFile.name : "Click to choose a .csv file"}
            </span>
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
          />
        </div>

        {errorMessage && (
          <div className="mt-4 rounded-md border border-[var(--risk-red)] bg-[var(--risk-red-bg)] px-3 py-2 text-sm text-[var(--risk-red)]">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            disabled={!canAnalyse}
            onClick={() => onAnalyse(pdfFile, csvFile)}
            className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isProcessing ? "Analysing…" : "Analyse Portfolio"}
          </button>
          <button
            type="button"
            onClick={onLoadSample}
            disabled={isProcessing}
            className="inline-flex items-center justify-center rounded-md border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[#f2f6fa] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Load Sample Data
          </button>
          <span className="text-xs text-[var(--muted)]">
            No sample files? Load sample data to preview the dashboard.
          </span>
        </div>
      </div>
    </div>
  );
}
