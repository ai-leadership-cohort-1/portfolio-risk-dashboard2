"use client";

import { DEFAULT_WEIGHTS, RISK_THRESHOLDS } from "@/lib/riskScoring";

interface UploadPanelProps {
  pdfFile: File | null;
  csvFile: File | null;
  onPdfFileChange: (file: File | null) => void;
  onCsvFileChange: (file: File | null) => void;
  onAnalyse: () => void;
  onLoadSample: () => void;
  isProcessing: boolean;
  errorMessage: string | null;
}

const fileInputClasses =
  "block w-full text-sm text-[var(--muted)] file:mr-4 file:rounded-md file:border-0 file:bg-[#171a1f] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#000000] file:cursor-pointer cursor-pointer";

export default function UploadPanel({
  pdfFile,
  csvFile,
  onPdfFileChange,
  onCsvFileChange,
  onAnalyse,
  onLoadSample,
  isProcessing,
  errorMessage,
}: UploadPanelProps) {
  const canAnalyse = csvFile !== null && !isProcessing;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-semibold text-[var(--foreground)]">
        Portfolio Risk Analysis
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
        Upload your lending policy document and customer portfolio to
        generate an executive risk dashboard and board-ready summary. All
        processing happens in your browser — no files are sent to a server.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            1. Lending Policy &amp; Risk Guidance (PDF)
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Used to surface key policy rules and thresholds referenced on the
            dashboard. Optional, but recommended.
          </p>
          <input
            type="file"
            accept="application/pdf"
            className={`${fileInputClasses} mt-4`}
            onChange={(e) => onPdfFileChange(e.target.files?.[0] || null)}
          />
          {pdfFile && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Selected: <span className="font-medium text-[var(--foreground)]">{pdfFile.name}</span>
            </p>
          )}
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--foreground)]">
            2. Customer Portfolio (CSV)
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            Expected columns: CustomerID, CustomerName, Industry, CreditScore,
            RepaymentStatus, LoanBalance. Column names are matched flexibly.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            className={`${fileInputClasses} mt-4`}
            onChange={(e) => onCsvFileChange(e.target.files?.[0] || null)}
          />
          {csvFile && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              Selected: <span className="font-medium text-[var(--foreground)]">{csvFile.name}</span>
            </p>
          )}
        </div>
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
          onClick={onAnalyse}
          className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-dark)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isProcessing ? "Analysing…" : "Run Analysis"}
        </button>
        <button
          type="button"
          onClick={onLoadSample}
          disabled={isProcessing}
          className="inline-flex items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[#f2f6fa] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isProcessing ? "Loading…" : "Load Sample Data"}
        </button>
      </div>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          How risk is scored
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
          Risk Score = (Credit Risk Weight × Credit Score Factor) +
          (Repayment Risk Weight × Repayment Status Factor) + (Exposure
          Weight × Loan Balance Factor). Each factor is normalised to 0–100,
          weights are {Math.round(DEFAULT_WEIGHTS.creditRiskWeight * 100)}% /{" "}
          {Math.round(DEFAULT_WEIGHTS.repaymentRiskWeight * 100)}% /{" "}
          {Math.round(DEFAULT_WEIGHTS.exposureWeight * 100)}% by default, and
          customers are classified Green (0–{RISK_THRESHOLDS.greenMax}), Amber
          ({RISK_THRESHOLDS.greenMax + 1}–{RISK_THRESHOLDS.amberMax}) or Red (
          {RISK_THRESHOLDS.amberMax + 1}–100). See the Executive Dashboard for
          full methodology and{" "}
          <code className="rounded bg-[#f2f6fa] px-1 py-0.5 text-xs">
            src/lib/riskScoring.ts
          </code>{" "}
          to adjust weights or thresholds.
        </p>
      </div>
    </div>
  );
}
