"use client";

import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import { ExtractedRule, RiskWeights, ScoredCustomer } from "@/lib/types";
import { DEFAULT_WEIGHTS } from "@/lib/riskScoring";

export interface AnalysisResult {
  customers: ScoredCustomer[];
  rules: ExtractedRule[];
  weights: RiskWeights;
  csvFileName: string;
  pdfFileName: string | null;
  analysedAt: Date;
  isSampleData: boolean;
}

interface AnalysisContextValue {
  result: AnalysisResult | null;
  setResult: (result: AnalysisResult | null) => void;
}

const AnalysisContext = createContext<AnalysisContextValue | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const value = useMemo(() => ({ result, setResult }), [result]);
  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}

export { DEFAULT_WEIGHTS };
