import { CustomerRecord } from "./types";

const SECTORS = [
  "Manufacturing",
  "Retail & Wholesale",
  "Construction",
  "Hospitality",
  "Agriculture",
  "Professional Services",
  "Healthcare",
  "Transport & Logistics",
];

const STATUSES = [
  "Current",
  "Current",
  "Current",
  "Watchlist",
  "Late 30",
  "Late 60",
  "Default",
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateSampleCustomers(count = 40): CustomerRecord[] {
  const rand = seededRandom(42);
  const customers: CustomerRecord[] = [];

  for (let i = 1; i <= count; i++) {
    const sector = SECTORS[Math.floor(rand() * SECTORS.length)];
    const status = STATUSES[Math.floor(rand() * STATUSES.length)];
    const creditScore = Math.round(300 + rand() * 550);
    const loanBalance = Math.round(5000 + rand() * 480000);

    customers.push({
      customerId: `CUST-${String(i).padStart(4, "0")}`,
      customerName: `Customer ${i}`,
      industrySector: sector,
      creditScore,
      repaymentStatus: status,
      loanBalance,
    });
  }

  return customers;
}

export const SAMPLE_POLICY_TEXT = `
Lending and Credit Risk Policy (Sample)

1. Minimum Credit Score. Applicants must have a minimum credit score of 620 to qualify for standard lending terms. Applicants below 580 are declined outright.

2. Debt-to-Income Ratio. The maximum acceptable debt-to-income (DTI) ratio is 43%. Exceptions above this threshold require senior credit committee approval.

3. Loan-to-Value. Loan-to-value (LTV) must not exceed 80% for secured facilities without additional collateral or guarantees.

4. Arrears and Delinquency. Accounts that are 30 days past due are placed on a watchlist for enhanced monitoring. Accounts 90 days past due are classified as non-performing and referred to collections.

5. Exposure Limits. Single-customer exposure is capped at $500,000 unless approved by the credit risk committee. Sector concentration should not exceed 30% of total portfolio exposure.

6. Default Definition. An account is considered in default after 90 days past due or upon formal write-off, whichever occurs first.

7. Risk Rating Review. All customer risk ratings must be reviewed quarterly, with high-risk accounts reviewed monthly.

8. Provisioning. Provisioning levels must reflect the expected credit loss associated with each risk grade, in line with the current risk rating framework.

9. Collateral Requirements. Collateral valuations must be refreshed annually for secured lending exceeding $100,000 in outstanding balance.

10. Covenant Monitoring. Financial covenants attached to commercial facilities must be tested at each reporting period, with breaches escalated within five business days.
`.trim();
