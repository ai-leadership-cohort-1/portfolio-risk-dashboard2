"use client";

import Link from "next/link";
import { useAnalysis } from "@/context/AnalysisContext";
import {
  exposureByIndustry,
  recommendedActions,
  summariseByCategory,
  topRiskiestCustomers,
} from "@/lib/aggregations";
import RiskBadge from "@/components/RiskBadge";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function SummaryPage() {
  const { result } = useAnalysis();

  if (!result) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-8">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          No analysis loaded yet
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Upload a customer portfolio to generate a board-ready summary.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-dark)]"
        >
          Go to Upload
        </Link>
      </div>
    );
  }

  const { customers, rules, csvFileName, pdfFileName, analysedAt, isSampleData } = result;

  const categorySummary = summariseByCategory(customers);
  const totalCustomers = customers.length;
  const totalExposure = customers.reduce((sum, c) => sum + c.loanBalance, 0);
  const industries = exposureByIndustry(customers);
  const topIndustry = industries[0];
  const topRisky = topRiskiestCustomers(customers, 5);
  const actions = recommendedActions(customers);
  const red = categorySummary.find((c) => c.category === "Red");
  const redShare = totalExposure > 0 ? ((red?.totalExposure || 0) / totalExposure) * 100 : 0;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 pb-16 sm:px-8 print:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
              Board Executive Summary
            </h1>
            {isSampleData && (
              <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Sample Data
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {csvFileName}
            {pdfFileName ? ` · ${pdfFileName}` : ""} · analysed{" "}
            {analysedAt.toLocaleDateString()}, {analysedAt.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[#f2f6fa] whitespace-nowrap"
          >
            ← Back to Dashboard
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-dark)] whitespace-nowrap"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">Portfolio Overview</h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">
          The portfolio comprises {totalCustomers.toLocaleString()} customers with total
          exposure of {formatCurrency(totalExposure)}. Of these,{" "}
          {categorySummary.find((c) => c.category === "Green")?.count || 0} are rated Green
          (Low Risk), {categorySummary.find((c) => c.category === "Amber")?.count || 0} are
          rated Amber (Medium Risk), and {red?.count || 0} are rated Red (High Risk),
          representing {formatCurrency(red?.totalExposure || 0)} ({redShare.toFixed(1)}%) of
          total exposure.
          {topIndustry &&
            ` The largest sector concentration is ${topIndustry.industry}, accounting for ${formatCurrency(
              topIndustry.exposure
            )} of exposure across ${topIndustry.count} customers.`}
        </p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
          Risk Category Breakdown
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Customers</th>
              <th className="py-2 pr-4">% of Customers</th>
              <th className="py-2 pr-4">Exposure</th>
              <th className="py-2 pr-4">% of Exposure</th>
            </tr>
          </thead>
          <tbody>
            {categorySummary.map((c) => (
              <tr key={c.category} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2.5 pr-4">
                  <RiskBadge category={c.category} />
                </td>
                <td className="py-2.5 pr-4 text-[var(--foreground)]">{c.count}</td>
                <td className="py-2.5 pr-4 text-[var(--muted)]">
                  {totalCustomers > 0 ? ((c.count / totalCustomers) * 100).toFixed(1) : "0.0"}%
                </td>
                <td className="py-2.5 pr-4 text-[var(--foreground)]">
                  {formatCurrency(c.totalExposure)}
                </td>
                <td className="py-2.5 pr-4 text-[var(--muted)]">
                  {totalExposure > 0 ? ((c.totalExposure / totalExposure) * 100).toFixed(1) : "0.0"}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
          Top 5 Highest-Risk Customers
        </h2>
        <ul className="divide-y divide-[var(--border)]">
          {topRisky.map((c) => (
            <li key={c.customerId} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="font-medium text-[var(--foreground)]">{c.customerName}</p>
                <p className="text-xs text-[var(--muted)]">
                  {c.industrySector} · {formatCurrency(c.loanBalance)} · risk score{" "}
                  {c.riskScore.toFixed(1)}
                </p>
              </div>
              <RiskBadge category={c.category} />
            </li>
          ))}
        </ul>
      </section>

      {rules.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
            Key Policy Rules Referenced
          </h2>
          <ul className="space-y-1.5">
            {rules.slice(0, 8).map((rule, idx) => (
              <li key={idx} className="text-sm leading-relaxed text-[var(--foreground)]">
                • {rule.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
          Recommended Actions
        </h2>
        <ul className="space-y-2">
          {actions.map((action, idx) => (
            <li key={idx} className="flex gap-2.5 text-sm text-[var(--foreground)]">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--accent)]" />
              <span className="leading-relaxed">{action}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
