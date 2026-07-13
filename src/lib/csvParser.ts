import Papa from "papaparse";
import { CustomerRecord } from "./types";

// Accepts common header variants so real-world exports parse without manual mapping.
const HEADER_ALIASES: Record<keyof CustomerRecord, string[]> = {
  customerId: ["customer_id", "customerid", "id", "account_id", "account number", "customer id"],
  customerName: ["customer_name", "customername", "name", "client name", "customer"],
  industrySector: ["industry_sector", "industry", "sector", "industry sector"],
  creditScore: ["credit_score", "creditscore", "credit score", "score", "bureau_score"],
  repaymentStatus: ["repayment_status", "repaymentstatus", "repayment status", "status", "arrears_status", "delinquency_status"],
  loanBalance: ["loan_balance", "loanbalance", "loan balance", "balance", "exposure", "outstanding_balance"],
};

function normaliseHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildHeaderMap(headers: string[]): Partial<Record<keyof CustomerRecord, string>> {
  const normalised = headers.map((h) => ({ raw: h, norm: normaliseHeader(h) }));
  const map: Partial<Record<keyof CustomerRecord, string>> = {};

  (Object.keys(HEADER_ALIASES) as (keyof CustomerRecord)[]).forEach((field) => {
    const aliases = HEADER_ALIASES[field];
    const match = normalised.find((h) => aliases.includes(h.norm));
    if (match) map[field] = match.raw;
  });

  return map;
}

export interface CsvParseResult {
  customers: CustomerRecord[];
  missingColumns: (keyof CustomerRecord)[];
  rowsSkipped: number;
}

export function parseCustomerCsv(fileText: string): CsvParseResult {
  const parsed = Papa.parse<Record<string, string>>(fileText, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = parsed.meta.fields || [];
  const headerMap = buildHeaderMap(headers);

  const requiredFields: (keyof CustomerRecord)[] = [
    "customerId",
    "customerName",
    "industrySector",
    "creditScore",
    "repaymentStatus",
    "loanBalance",
  ];
  const missingColumns = requiredFields.filter((f) => !headerMap[f]);

  let rowsSkipped = 0;
  const customers: CustomerRecord[] = [];

  for (const row of parsed.data) {
    if (missingColumns.length > 0) continue;

    const rawCreditScore = row[headerMap.creditScore!];
    const rawBalance = row[headerMap.loanBalance!];
    const creditScore = parseFloat(String(rawCreditScore).replace(/[^0-9.-]/g, ""));
    const loanBalance = parseFloat(String(rawBalance).replace(/[^0-9.-]/g, ""));

    const customerId = row[headerMap.customerId!]?.trim();
    if (!customerId || Number.isNaN(creditScore) || Number.isNaN(loanBalance)) {
      rowsSkipped++;
      continue;
    }

    customers.push({
      customerId,
      customerName: row[headerMap.customerName!]?.trim() || customerId,
      industrySector: row[headerMap.industrySector!]?.trim() || "Unclassified",
      creditScore,
      repaymentStatus: row[headerMap.repaymentStatus!]?.trim() || "Unknown",
      loanBalance,
    });
  }

  return { customers, missingColumns, rowsSkipped };
}
