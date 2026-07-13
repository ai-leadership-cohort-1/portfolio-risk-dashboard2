import { ExtractedRule } from "./types";

// Keywords that typically signal a lending/risk policy rule worth surfacing.
const RULE_KEYWORDS = [
  "credit score",
  "debt-to-income",
  "debt to income",
  "dti",
  "loan-to-value",
  "loan to value",
  "ltv",
  "delinquen",
  "default",
  "past due",
  "arrears",
  "watchlist",
  "covenant",
  "exposure limit",
  "concentration limit",
  "threshold",
  "risk rating",
  "risk grade",
  "write-off",
  "write off",
  "provisioning",
  "collateral",
  "minimum",
  "maximum",
];

async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  const workerUrl = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl.toString();

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
}

function splitIntoStatements(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.;])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15 && s.length < 320);
}

export function extractRulesFromText(text: string): ExtractedRule[] {
  const statements = splitIntoStatements(text);
  const rules: ExtractedRule[] = [];
  const seen = new Set<string>();

  for (const statement of statements) {
    const lower = statement.toLowerCase();
    const matchedKeyword = RULE_KEYWORDS.find((k) => lower.includes(k));
    if (matchedKeyword && !seen.has(statement)) {
      seen.add(statement);
      rules.push({ keyword: matchedKeyword, text: statement });
    }
  }

  return rules.slice(0, 25);
}

export interface PdfParseResult {
  rawText: string;
  rules: ExtractedRule[];
}

export async function parsePolicyPdf(file: File): Promise<PdfParseResult> {
  const rawText = await extractTextFromPdf(file);
  const rules = extractRulesFromText(rawText);
  return { rawText, rules };
}
