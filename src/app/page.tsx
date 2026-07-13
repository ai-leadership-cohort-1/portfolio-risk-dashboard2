"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadPanel from "@/components/UploadPanel";
import { parseCustomerCsv } from "@/lib/csvParser";
import { parsePolicyPdf } from "@/lib/pdfParser";
import { DEFAULT_WEIGHTS, scoreAllCustomers } from "@/lib/riskScoring";
import { useAnalysis } from "@/context/AnalysisContext";

const SAMPLE_CSV_PATH = "/sample-data/sample-customers.csv";
const SAMPLE_PDF_PATH = "/sample-data/sample-lending-policy.pdf";

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

      const pdfResult = pdfFile ? await parsePolicyPdf(pdfFile) : null;
      const scored = scoreAllCustomers(csvResult.customers, DEFAULT_WEIGHTS);

      setResult({
        customers: scored,
        rules: pdfResult ? pdfResult.rules : [],
        weights: DEFAULT_WEIGHTS,
        csvFileName: csvFile.name,
        pdfFileName: pdfFile ? pdfFile.name : null,
        pdfPageCount: pdfResult ? pdfResult.pageCount : null,
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

  async function handleLoadSample() {
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const [csvResponse, pdfResponse] = await Promise.all([
        fetch(SAMPLE_CSV_PATH),
        fetch(SAMPLE_PDF_PATH),
      ]);

      if (!csvResponse.ok || !pdfResponse.ok) {
        throw new Error("Sample data files could not be loaded.");
      }

      const csvText = await csvResponse.text();
      const csvResult = parseCustomerCsv(csvText);

      if (csvResult.missingColumns.length > 0 || csvResult.customers.length === 0) {
        setErrorMessage("The bundled sample CSV appears to be invalid.");
        return;
      }

      const pdfBlob = await pdfResponse.blob();
      const pdfFile = new File([pdfBlob], "sample-lending-policy.pdf", {
        type: "application/pdf",
      });
      const { rules, pageCount } = await parsePolicyPdf(pdfFile);
      const scored = scoreAllCustomers(csvResult.customers, DEFAULT_WEIGHTS);

      setResult({
        customers: scored,
        rules,
        weights: DEFAULT_WEIGHTS,
        csvFileName: "sample-customers.csv",
        pdfFileName: "sample-lending-policy.pdf",
        pdfPageCount: pageCount,
        analysedAt: new Date(),
        isSampleData: true,
      });
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMessage("Could not load the sample data. Please try again or upload your own files.");
    } finally {
      setIsProcessing(false);
    }
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
