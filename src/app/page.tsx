"use client";

import { useState } from "react";
import UploadPanel from "@/components/UploadPanel";
import Dashboard from "@/components/Dashboard";
import { parseCustomerCsv } from "@/lib/csvParser";
import { extractRulesFromText, parsePolicyPdf } from "@/lib/pdfParser";
import { DEFAULT_WEIGHTS, scoreAllCustomers } from "@/lib/riskScoring";
import { ExtractedRule, ScoredCustomer } from "@/lib/types";
import { generateSampleCustomers, SAMPLE_POLICY_TEXT } from "@/lib/sampleData";

export default function Home() {
  const [customers, setCustomers] = useState<ScoredCustomer[] | null>(null);
  const [rules, setRules] = useState<ExtractedRule[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSampleData, setIsSampleData] = useState(false);

  async function handleAnalyse(pdfFile: File | null, csvFile: File | null) {
    setErrorMessage(null);
    if (!pdfFile || !csvFile) {
      setErrorMessage("Please upload both a policy PDF and a customer portfolio CSV.");
      return;
    }

    setIsProcessing(true);
    try {
      const csvText = await csvFile.text();
      const csvResult = parseCustomerCsv(csvText);

      if (csvResult.missingColumns.length > 0) {
        setErrorMessage(
          `The CSV is missing required columns: ${csvResult.missingColumns.join(
            ", "
          )}. Expected columns (case-insensitive) include customer id, customer name, industry sector, credit score, repayment status, and loan balance.`
        );
        setIsProcessing(false);
        return;
      }

      if (csvResult.customers.length === 0) {
        setErrorMessage("No valid customer rows were found in the uploaded CSV.");
        setIsProcessing(false);
        return;
      }

      const pdfResult = await parsePolicyPdf(pdfFile);

      const scored = scoreAllCustomers(csvResult.customers, DEFAULT_WEIGHTS);
      setCustomers(scored);
      setRules(pdfResult.rules);
      setIsSampleData(false);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        "Something went wrong while analysing the uploaded files. Please confirm the PDF is not password-protected and the CSV is well-formed, then try again."
      );
    } finally {
      setIsProcessing(false);
    }
  }

  function handleLoadSample() {
    setErrorMessage(null);
    const sampleCustomers = generateSampleCustomers(40);
    const scored = scoreAllCustomers(sampleCustomers, DEFAULT_WEIGHTS);
    setCustomers(scored);
    setRules(extractRulesFromText(SAMPLE_POLICY_TEXT));
    setIsSampleData(true);
  }

  function handleReset() {
    setCustomers(null);
    setRules([]);
    setErrorMessage(null);
    setIsSampleData(false);
  }

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)] px-4 py-8 sm:px-8">
      {customers ? (
        <Dashboard
          customers={customers}
          rules={rules}
          weights={DEFAULT_WEIGHTS}
          isSampleData={isSampleData}
          onReset={handleReset}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <UploadPanel
            onAnalyse={handleAnalyse}
            onLoadSample={handleLoadSample}
            isProcessing={isProcessing}
            errorMessage={errorMessage}
          />
        </div>
      )}
    </div>
  );
}
