"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExtractedRule, RiskCategory, RiskWeights, ScoredCustomer } from "@/lib/types";
import {
  exposureByIndustry,
  generatePortfolioTrend,
  recommendedActions,
  summariseByCategory,
  topRiskiestCustomers,
} from "@/lib/aggregations";
import RiskBadge from "./RiskBadge";
import { useState } from "react";

const CATEGORY_COLORS: Record<RiskCategory, string> = {
  Green: "#2f7d4f",
  Amber: "#b5720f",
  Red: "#b13030",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

interface DashboardProps {
  customers: ScoredCustomer[];
  rules: ExtractedRule[];
  weights: RiskWeights;
  isSampleData: boolean;
  onReset: () => void;
}

export default function Dashboard({
  customers,
  rules,
  weights,
  isSampleData,
  onReset,
}: DashboardProps) {
  const [rulesExpanded, setRulesExpanded] = useState(false);

  const categorySummary = summariseByCategory(customers);
  const topRisky = topRiskiestCustomers(customers, 10);
  const industryExposure = exposureByIndustry(customers);
  const trend = generatePortfolioTrend(customers);
  const actions = recommendedActions(customers);

  const totalCustomers = customers.length;
  const totalExposure = customers.reduce((sum, c) => sum + c.loanBalance, 0);

  const categoryCountData = categorySummary.map((c) => ({
    category: c.category,
    count: c.count,
  }));
  const categoryExposureData = categorySummary.map((c) => ({
    category: c.category,
    exposure: c.totalExposure,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-16">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Portfolio Risk Dashboard
          </h1>
          {isSampleData && (
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Showing sample data for demonstration purposes.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="self-start rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[#f2f6fa] sm:self-auto"
        >
          Upload New Files
        </button>
      </div>

      {/* Scoring methodology */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--foreground)]">
          Risk Scoring Methodology
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          Risk Score = (Credit Risk Weight × Credit Score Factor) + (Repayment
          Risk Weight × Repayment Status Factor) + (Exposure Weight × Loan
          Balance Factor), each factor normalised to a 0–100 scale. Current
          weighting: Credit Risk {Math.round(weights.creditRiskWeight * 100)}%,
          Repayment Risk {Math.round(weights.repaymentRiskWeight * 100)}%,
          Exposure {Math.round(weights.exposureWeight * 100)}%. Customers
          scoring 0–35 are Green (Low Risk), 36–65 are Amber (Medium Risk), and
          above 65 are Red (High Risk).
        </p>
      </section>

      {/* Extracted rules */}
      {rules.length > 0 && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm">
          <button
            type="button"
            onClick={() => setRulesExpanded((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              Extracted Lending & Risk Rules ({rules.length})
            </h2>
            <span className="text-xs text-[var(--accent)]">
              {rulesExpanded ? "Hide" : "Show"}
            </span>
          </button>
          {rulesExpanded && (
            <ul className="mt-3 space-y-2">
              {rules.map((rule, idx) => (
                <li
                  key={idx}
                  className="rounded-md bg-[#f6f7f9] px-3 py-2 text-sm text-[var(--foreground)]"
                >
                  {rule.text}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Total Customers" value={totalCustomers.toLocaleString()} />
        <KpiCard label="Total Exposure" value={formatCurrency(totalExposure)} />
        {categorySummary.map((c) => (
          <KpiCard
            key={c.category}
            label={`${c.category} Customers`}
            value={c.count.toLocaleString()}
            accentColor={CATEGORY_COLORS[c.category]}
          />
        ))}
      </section>

      {/* Category charts */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Customers by Risk Category">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryCountData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5e9" />
              <XAxis dataKey="category" stroke="#5b6572" fontSize={12} />
              <YAxis stroke="#5b6572" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {categoryCountData.map((entry) => (
                  <Bar key={entry.category} dataKey="count" fill={CATEGORY_COLORS[entry.category as RiskCategory]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Exposure by Risk Category">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryExposureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5e9" />
              <XAxis dataKey="category" stroke="#5b6572" fontSize={12} />
              <YAxis
                stroke="#5b6572"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="exposure" radius={[4, 4, 0, 0]}>
                {categoryExposureData.map((entry) => (
                  <Bar key={entry.category} dataKey="exposure" fill={CATEGORY_COLORS[entry.category as RiskCategory]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* Industry exposure + trend */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Exposure by Industry Sector">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={industryExposure} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5e9" />
              <XAxis
                type="number"
                stroke="#5b6572"
                fontSize={12}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="industry"
                stroke="#5b6572"
                fontSize={11}
                width={140}
              />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="exposure" fill="#2c5a8c" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Portfolio Risk Trend"
          subtitle="Illustrative trend leading up to current position"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5e9" />
              <XAxis dataKey="period" stroke="#5b6572" fontSize={12} />
              <YAxis stroke="#5b6572" fontSize={12} domain={[0, 100]} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="averageRiskScore"
                name="Average Risk Score"
                stroke="#2c5a8c"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* Top 10 riskiest customers */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">
          Top 10 Highest-Risk Customers
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--muted)]">
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Industry</th>
                <th className="py-2 pr-4">Credit Score</th>
                <th className="py-2 pr-4">Repayment Status</th>
                <th className="py-2 pr-4">Loan Balance</th>
                <th className="py-2 pr-4">Risk Score</th>
                <th className="py-2 pr-4">Category</th>
              </tr>
            </thead>
            <tbody>
              {topRisky.map((c) => (
                <tr key={c.customerId} className="border-b border-[var(--border)] last:border-0">
                  <td className="py-2.5 pr-4 font-medium text-[var(--foreground)]">
                    {c.customerName}
                  </td>
                  <td className="py-2.5 pr-4 text-[var(--muted)]">{c.industrySector}</td>
                  <td className="py-2.5 pr-4 text-[var(--muted)]">{c.creditScore}</td>
                  <td className="py-2.5 pr-4 text-[var(--muted)]">{c.repaymentStatus}</td>
                  <td className="py-2.5 pr-4 text-[var(--muted)]">
                    {formatCurrency(c.loanBalance)}
                  </td>
                  <td className="py-2.5 pr-4 font-medium text-[var(--foreground)]">
                    {c.riskScore.toFixed(1)}
                  </td>
                  <td className="py-2.5 pr-4">
                    <RiskBadge category={c.category} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recommended actions */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm">
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

function KpiCard({
  label,
  value,
  accentColor,
}: {
  label: string;
  value: string;
  accentColor?: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p
        className="mt-1 text-lg font-semibold"
        style={{ color: accentColor || "var(--foreground)" }}
      >
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
      {subtitle && <p className="text-xs text-[var(--muted)] mt-0.5">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}
