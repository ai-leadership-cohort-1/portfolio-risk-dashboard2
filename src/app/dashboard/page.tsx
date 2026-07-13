"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAnalysis } from "@/context/AnalysisContext";
import { RiskCategory } from "@/lib/types";
import {
  exposureByIndustry,
  generatePortfolioTrend,
  recommendedActions,
  riskScoreDistribution,
  summariseByCategory,
  topRiskiestCustomers,
} from "@/lib/aggregations";
import { categoriseRiskScore } from "@/lib/riskScoring";
import RiskBadge from "@/components/RiskBadge";

const CATEGORY_COLORS: Record<RiskCategory, string> = {
  Green: "#2f7d4f",
  Amber: "#b5720f",
  Red: "#b13030",
};

const EXPOSURE_BAR_COLOR = "#333a42";

const INDUSTRY_PALETTE = [
  "#1f4267",
  "#2c5a8c",
  "#4a7ab0",
  "#7098c2",
  "#9db8d6",
  "#5b6572",
  "#8b95a1",
  "#b8c0c9",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

// The "Customers" bar is coloured per risk category (via per-cell fills),
// not a single flat colour, so recharts' default legend (which reads the
// Bar's own fill) can't represent it accurately. This custom legend spells
// out what each colour actually means instead.
function CategoryChartLegend() {
  const categories: RiskCategory[] = ["Green", "Amber", "Red"];
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-[var(--muted)]">
      <span className="flex items-center gap-3">
        <span className="font-medium text-[var(--foreground)]">Customers</span>
        {categories.map((cat) => (
          <span key={cat} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: CATEGORY_COLORS[cat] }}
            />
            {cat}
          </span>
        ))}
      </span>
      <span className="flex items-center gap-1.5 border-l border-[var(--border)] pl-5">
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{ backgroundColor: EXPOSURE_BAR_COLOR }}
        />
        Exposure
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { result } = useAnalysis();

  if (!result) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-8">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">
          No analysis loaded yet
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Upload a customer portfolio (and optionally a lending policy) to
          generate the executive dashboard.
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

  const { customers, csvFileName, pdfFileName, analysedAt } = result;

  const categorySummary = summariseByCategory(customers);
  const topRisky = topRiskiestCustomers(customers, 10);
  const industryExposure = exposureByIndustry(customers);
  const trend = generatePortfolioTrend(customers);
  const distribution = riskScoreDistribution(customers);
  const actions = recommendedActions(customers);

  const totalCustomers = customers.length;
  const totalExposure = customers.reduce((sum, c) => sum + c.loanBalance, 0);

  const combinedCategoryData = categorySummary.map((c) => ({
    category: c.category,
    count: c.count,
    exposure: c.totalExposure,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 pb-16 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Executive Dashboard
          </h1>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {totalCustomers.toLocaleString()} customers · {csvFileName}
            {pdfFileName ? ` · ${pdfFileName}` : " · no policy uploaded"} ·
            analysed{" "}
            {analysedAt.toLocaleDateString()}, {analysedAt.toLocaleTimeString()}
          </p>
        </div>
        <Link
          href="/summary"
          className="inline-flex items-center justify-center rounded-md border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[#f2f6fa] whitespace-nowrap"
        >
          View Board Executive Summary →
        </Link>
      </div>

      {/* Category KPI cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        {categorySummary.map((c) => {
          const pctCustomers = totalCustomers > 0 ? (c.count / totalCustomers) * 100 : 0;
          const pctExposure = totalExposure > 0 ? (c.totalExposure / totalExposure) * 100 : 0;
          return (
            <div
              key={c.category}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--foreground)]">{c.category}</p>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[c.category] }}
                />
              </div>
              <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{c.count}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {pctCustomers.toFixed(1)}% of customers ·{" "}
                {formatCompactCurrency(c.totalExposure)} exposure ({pctExposure.toFixed(1)}%)
              </p>
            </div>
          );
        })}
      </section>

      {/* Total exposure */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <p className="text-sm text-[var(--muted)]">Total portfolio exposure</p>
        <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
          {formatCurrency(totalExposure)}
        </p>
      </section>

      {/* Combined category chart + industry pie */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Customers &amp; Exposure by Risk Category">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={combinedCategoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5e9" />
              <XAxis dataKey="category" stroke="#5b6572" fontSize={12} />
              <YAxis yAxisId="left" stroke="#5b6572" fontSize={12} allowDecimals={false} />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#5b6572"
                fontSize={12}
                tickFormatter={(v) => formatCompactCurrency(Number(v))}
              />
              <Tooltip
                formatter={(value, name) =>
                  name === "exposure" ? formatCurrency(Number(value)) : value
                }
              />
              <Legend content={<CategoryChartLegend />} />
              <Bar yAxisId="left" dataKey="count" name="Customers" radius={[4, 4, 0, 0]}>
                {combinedCategoryData.map((entry) => (
                  <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category as RiskCategory]} />
                ))}
              </Bar>
              <Bar
                yAxisId="right"
                dataKey="exposure"
                name="Exposure"
                fill={EXPOSURE_BAR_COLOR}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Exposure by Industry Sector">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={industryExposure}
                dataKey="exposure"
                nameKey="industry"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(props: unknown) => (props as { name?: string }).name || ""}
                labelLine
              >
                {industryExposure.map((entry, idx) => (
                  <Cell key={entry.industry} fill={INDUSTRY_PALETTE[idx % INDUSTRY_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* Distribution + trend */}
      <section className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Portfolio Risk Distribution"
          subtitle="Customer count by risk-score decile (0 = lowest risk, 100 = highest)"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e5e9" />
              <XAxis dataKey="bucket" stroke="#5b6572" fontSize={11} />
              <YAxis stroke="#5b6572" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" name="Customers" radius={[4, 4, 0, 0]}>
                {distribution.map((entry) => (
                  <Cell key={entry.bucket} fill={CATEGORY_COLORS[categoriseRiskScore(entry.midpoint)]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Portfolio Risk Trend"
          subtitle="Illustrative trend leading up to current position"
        >
          <ResponsiveContainer width="100%" height={260}>
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
                stroke="var(--accent)"
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
