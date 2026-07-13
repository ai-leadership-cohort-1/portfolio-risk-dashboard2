import { CategorySummary, IndustryExposure, RiskCategory, ScoredCustomer, TrendPoint } from "./types";

const CATEGORY_ORDER: RiskCategory[] = ["Green", "Amber", "Red"];

export function summariseByCategory(customers: ScoredCustomer[]): CategorySummary[] {
  return CATEGORY_ORDER.map((category) => {
    const inCategory = customers.filter((c) => c.category === category);
    return {
      category,
      count: inCategory.length,
      totalExposure: inCategory.reduce((sum, c) => sum + c.loanBalance, 0),
    };
  });
}

export function topRiskiestCustomers(customers: ScoredCustomer[], n = 10): ScoredCustomer[] {
  return [...customers].sort((a, b) => b.riskScore - a.riskScore).slice(0, n);
}

export function exposureByIndustry(customers: ScoredCustomer[]): IndustryExposure[] {
  const map = new Map<string, IndustryExposure>();
  for (const c of customers) {
    const key = c.industrySector || "Unclassified";
    const existing = map.get(key) || { industry: key, exposure: 0, count: 0 };
    existing.exposure += c.loanBalance;
    existing.count += 1;
    map.set(key, existing);
  }
  return [...map.values()].sort((a, b) => b.exposure - a.exposure);
}

/**
 * Generates a synthetic historical trend leading up to the current, real
 * portfolio position. This is illustrative sample data only (no historical
 * snapshots exist client-side) and is clearly labelled as such in the UI.
 */
export function generatePortfolioTrend(customers: ScoredCustomer[], months = 6): TrendPoint[] {
  const now = new Date();
  const currentAvg =
    customers.length > 0
      ? customers.reduce((sum, c) => sum + c.riskScore, 0) / customers.length
      : 0;

  const currentByCategory = summariseByCategory(customers);
  const currentExposure = {
    Green: currentByCategory.find((c) => c.category === "Green")?.totalExposure || 0,
    Amber: currentByCategory.find((c) => c.category === "Amber")?.totalExposure || 0,
    Red: currentByCategory.find((c) => c.category === "Red")?.totalExposure || 0,
  };

  // simple seeded pseudo-random so the trend is stable across re-renders
  let seed = customers.length * 7919 + 13;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const points: TrendPoint[] = [];
  for (let i = months; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const period = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

    // drift factor tapers to 0 (i.e. equals current actuals) at i = 0
    const driftMagnitude = (i / Math.max(months, 1)) * 12; // up to +/-12 pts historically
    const drift = (rand() - 0.55) * driftMagnitude;
    const averageRiskScore = i === 0 ? currentAvg : Math.max(0, Math.min(100, currentAvg + drift));

    const exposureDrift = 1 + (rand() - 0.5) * (i / Math.max(months, 1)) * 0.3;
    points.push({
      period,
      averageRiskScore: Math.round(averageRiskScore * 10) / 10,
      redExposure: i === 0 ? currentExposure.Red : Math.round(currentExposure.Red * exposureDrift),
      amberExposure: i === 0 ? currentExposure.Amber : Math.round(currentExposure.Amber * exposureDrift),
      greenExposure: i === 0 ? currentExposure.Green : Math.round(currentExposure.Green * exposureDrift),
    });
  }

  return points;
}

export function recommendedActions(customers: ScoredCustomer[]): string[] {
  const summary = summariseByCategory(customers);
  const red = summary.find((c) => c.category === "Red");
  const amber = summary.find((c) => c.category === "Amber");
  const totalExposure = customers.reduce((sum, c) => sum + c.loanBalance, 0);
  const redShare = totalExposure > 0 ? (red?.totalExposure || 0) / totalExposure : 0;

  const actions: string[] = [];

  if (red && red.count > 0) {
    actions.push(
      `Escalate the ${red.count} Red (High Risk) customer${red.count === 1 ? "" : "s"} for immediate credit review and, where applicable, initiate collections or restructuring conversations.`
    );
  }
  if (redShare > 0.15) {
    actions.push(
      `Red-rated exposure represents ${(redShare * 100).toFixed(1)}% of total portfolio balance, above a prudent 15% concentration guideline — consider tightening new-lending criteria until this normalises.`
    );
  }
  if (amber && amber.count > 0) {
    actions.push(
      `Place the ${amber.count} Amber (Medium Risk) customer${amber.count === 1 ? "" : "s"} on a watchlist with quarterly review to catch further deterioration early.`
    );
  }

  const industries = new Map<string, number>();
  customers.forEach((c) => {
    industries.set(c.industrySector, (industries.get(c.industrySector) || 0) + c.loanBalance);
  });
  const sortedIndustries = [...industries.entries()].sort((a, b) => b[1] - a[1]);
  if (sortedIndustries.length > 0 && totalExposure > 0) {
    const [topIndustry, topExposure] = sortedIndustries[0];
    const share = topExposure / totalExposure;
    if (share > 0.3) {
      actions.push(
        `${topIndustry} accounts for ${(share * 100).toFixed(1)}% of total exposure — review sector concentration limits and stress-test against a sector-specific downturn.`
      );
    }
  }

  if (actions.length === 0) {
    actions.push("Portfolio risk profile is within normal parameters. Maintain standard quarterly monitoring cadence.");
  }

  return actions;
}
