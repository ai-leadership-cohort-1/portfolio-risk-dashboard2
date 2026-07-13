"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadPanel from "@/components/UploadPanel";
import { parseCustomerCsv } from "@/lib/csvParser";
import { extractRulesFromText, parsePolicyPdf } from "@/lib/pdfParser";
import { DEFAULT_WEIGHTS, scoreAllCustomers } from "@/lib/riskScoring";
import { generateSampleCustomers, SAMPLE_POLICY_TEXT } from "@/lib/sampleData";
import { useAnalysis } from "@/context/AnalysisContext";

export default function Home() {
  const router = useRouter();
  const { setResult } = useAnalysis();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAnalyse(pdfFile: File | null, csvFile: File | null) {
    setErrorMessage(null);
    if (!csvFile) {
      setErrorMessage("Please upload a customer portfolio CSV to run the analysis.");
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

      const rules = pdfFile ? (await parsePolicyPdf(pdfFile)).rules : [];
      const scored = scoreAllCustomers(csvResult.customers, DEFAULT_WEIGHTS);

      setResult({
        customers: scored,
        rules,
        weights: DEFAULT_WEIGHTS,
        csvFileName: csvFile.name,
        pdfFileName: pdfFile ? pdfFile.name : null,
        analysedAt: new Date(),
        isSampleData: false,
      });
      router.push("/dashboard");
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
    const sampleCustomers = generateSampleCustomers(20);
    const scored = scoreAllCustomers(sampleCustomers, DEFAULT_WEIGHTS);
    setResult({
      customers: scored,
      rules: extractRulesFromText(SAMPLE_POLICY_TEXT),
      weights: DEFAULT_WEIGHTS,
      csvFileName: "sample-customers.csv",
      pdfFileName: "sample-lending-policy.pdf",
      analysedAt: new Date(),
      isSampleData: true,
    });
    router.push("/dashboard");
  }

  return (
    <UploadPanel
      onAnalyse={handleAnalyse}
      onLoadSample={handleLoadSample}
      isProcessing={isProcessing}
      errorMessage={errorMessage}
    />
  );
}
