export type RiskCategory = "Green" | "Amber" | "Red";

export interface CustomerRecord {
  customerId: string;
  customerName: string;
  industrySector: string;
  creditScore: number;
  repaymentStatus: string;
  loanBalance: number;
}

export interface ScoredCustomer extends CustomerRecord {
  creditScoreFactor: number;
  repaymentRiskFactor: number;
  exposureFactor: number;
  riskScore: number;
  category: RiskCategory;
}

export interface RiskWeights {
  creditRiskWeight: number;
  repaymentRiskWeight: number;
  exposureWeight: number;
}

export interface CategorySummary {
  category: RiskCategory;
  count: number;
  totalExposure: number;
}

export interface IndustryExposure {
  industry: string;
  exposure: number;
  count: number;
}

export interface TrendPoint {
  period: string;
  averageRiskScore: number;
  redExposure: number;
  amberExposure: number;
  greenExposure: number;
}

export interface ExtractedRule {
  keyword: string;
  text: string;
}
