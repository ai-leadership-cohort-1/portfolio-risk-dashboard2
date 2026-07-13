import { CustomerRecord, RiskCategory, RiskWeights, ScoredCustomer } from "./types";

/**
 * ============================================================================
 * SCORING CONFIGURATION
 * This is the single file to edit to change how risk is scored or categorised.
 * ============================================================================
 */

// Relative importance of each risk driver. Must sum to 1.
// Credit history and repayment behaviour are weighted highest because they are
// the strongest predictors of default probability. Exposure is weighted lower
// because it reflects materiality (impact) rather than likelihood of default.
export const DEFAULT_WEIGHTS: RiskWeights = {
  creditRiskWeight: 0.4,
  repaymentRiskWeight: 0.4,
  exposureWeight: 0.2,
};

// Loan balance ($) treated as "maximum exposure" for normalisation purposes.
// Any balance at or above this is scored as full (100) exposure risk.
export const EXPOSURE_CAP = 500_000;

// Credit score band (typical bureau scale) used to normalise credit score.
export const CREDIT_SCORE_MIN = 300;
export const CREDIT_SCORE_MAX = 850;

// Risk score (0-100) thresholds that determine the traffic-light category.
export const RISK_THRESHOLDS = {
  greenMax: 35, // 0-35   => Green  (Low Risk)
  amberMax: 65, // 36-65  => Amber (Medium Risk)
  // > 65 => Red (High Risk)
};

/**
 * Maps a free-text repayment status (as found in typical portfolio exports)
 * to a 0-100 risk factor. Falls back to parsing "days past due" style values.
 */
export function repaymentStatusToFactor(status: string): number {
  const s = (status || "").trim().toLowerCase();

  const table: Record<string, number> = {
    "current": 0,
    "on time": 0,
    "on-time": 0,
    "up to date": 0,
    "paid": 0,
    "watch": 20,
    "watchlist": 20,
    "grace period": 20,
    "late 1-29": 35,
    "1-29 days": 35,
    "late 30": 55,
    "30 days past due": 55,
    "30-59 days": 55,
    "late 60": 75,
    "60 days past due": 60,
    "60-89 days": 75,
    "late 90": 90,
    "90+ days past due": 90,
    "90 days past due": 90,
    "default": 100,
    "defaulted": 100,
    "write-off": 100,
    "written off": 100,
    "non-performing": 95,
    "npl": 95,
  };

  if (s in table) return table[s];

  // fallback: try to parse a leading number of days past due, e.g. "45 days"
  const numMatch = s.match(/(\d+)/);
  if (numMatch) {
    const days = parseInt(numMatch[1], 10);
    if (!Number.isNaN(days)) {
      if (days <= 0) return 0;
      if (days < 30) return 30;
      if (days < 60) return 55;
      if (days < 90) return 75;
      return 100;
    }
  }

  // unknown status: treat as moderate risk rather than silently ignoring
  return 50;
}

export function creditScoreToFactor(creditScore: number): number {
  const clamped = Math.min(Math.max(creditScore, CREDIT_SCORE_MIN), CREDIT_SCORE_MAX);
  const factor = ((CREDIT_SCORE_MAX - clamped) / (CREDIT_SCORE_MAX - CREDIT_SCORE_MIN)) * 100;
  return Math.round(factor * 100) / 100;
}

export function exposureToFactor(loanBalance: number): number {
  const factor = Math.min(Math.max(loanBalance, 0) / EXPOSURE_CAP, 1) * 100;
  return Math.round(factor * 100) / 100;
}

export function categoriseRiskScore(riskScore: number): RiskCategory {
  if (riskScore <= RISK_THRESHOLDS.greenMax) return "Green";
  if (riskScore <= RISK_THRESHOLDS.amberMax) return "Amber";
  return "Red";
}

export function scoreCustomer(
  customer: CustomerRecord,
  weights: RiskWeights = DEFAULT_WEIGHTS
): ScoredCustomer {
  const creditScoreFactor = creditScoreToFactor(customer.creditScore);
  const repaymentRiskFactor = repaymentStatusToFactor(customer.repaymentStatus);
  const exposureFactor = exposureToFactor(customer.loanBalance);

  const riskScore =
    weights.creditRiskWeight * creditScoreFactor +
    weights.repaymentRiskWeight * repaymentRiskFactor +
    weights.exposureWeight * exposureFactor;

  const rounded = Math.round(riskScore * 100) / 100;

  return {
    ...customer,
    creditScoreFactor,
    repaymentRiskFactor,
    exposureFactor,
    riskScore: rounded,
    category: categoriseRiskScore(rounded),
  };
}

export function scoreAllCustomers(
  customers: CustomerRecord[],
  weights: RiskWeights = DEFAULT_WEIGHTS
): ScoredCustomer[] {
  return customers.map((c) => scoreCustomer(c, weights));
}
