# Portfolio Risk Dashboard

An executive dashboard prototype for analysing lending portfolio risk. Upload
a lending policy PDF and a customer portfolio CSV, and the app produces a
risk-scored, categorised view of the portfolio with charts and recommended
actions — entirely client-side, in your browser.

## What it does

- **Upload a lending policy (PDF).** The app extracts sentences containing
  key risk terms (credit score minimums, DTI/LTV limits, arrears thresholds,
  exposure limits, etc.) and lists them as reference rules.
- **Upload a customer portfolio (CSV).** Expected columns (case-insensitive,
  common aliases accepted): customer id, customer name, industry sector,
  credit score, repayment status, loan balance.
- **Scores every customer** using:

  `Risk Score = (Credit Risk Weight × Credit Score Factor) + (Repayment Risk Weight × Repayment Status Factor) + (Exposure Weight × Loan Balance Factor)`

  Each factor is normalised to 0–100. Default weights: Credit Risk 40%,
  Repayment Risk 40%, Exposure 20%.
- **Categorises each customer** as Green (Low Risk, 0–35), Amber (Medium
  Risk, 36–65), or Red (High Risk, 66–100).
- **Displays an executive dashboard**: customer counts and exposure by risk
  category, top 10 highest-risk customers, exposure by industry sector, a
  portfolio risk trend chart, and recommended actions.
- A **"Load Sample Data"** button generates a synthetic 40-customer portfolio
  and sample policy text, so the dashboard can be previewed without any
  files on hand.

All parsing and scoring runs in the browser. Nothing is uploaded to a server,
there is no backend, no database, and no data is persisted.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push this repository to GitHub (already done if you're reading this from
   the deployed repo).
2. In Vercel, choose **Import Project** → select this GitHub repository.
3. Accept the default Next.js build settings — no environment variables or
   extra configuration are required.
4. Deploy.

## Changing scoring thresholds or weights

Edit **`src/lib/riskScoring.ts`**. This is the single file that controls:

- `DEFAULT_WEIGHTS` — the relative weight of credit risk, repayment risk,
  and exposure (must sum to 1).
- `EXPOSURE_CAP` — the loan balance treated as "maximum" exposure risk.
- `CREDIT_SCORE_MIN` / `CREDIT_SCORE_MAX` — the credit score band used for
  normalisation.
- `RISK_THRESHOLDS` — the 0–100 risk score cut-offs for Green / Amber / Red.

## Tech stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Recharts ·
Papaparse · pdfjs-dist. Fully client-side — no backend, no external APIs, no
authentication.

## Scope

**In scope:** PDF rule extraction (keyword-based), CSV portfolio scoring,
risk categorisation, executive dashboard with charts, illustrative portfolio
trend visualisation, recommended actions.

**Out of scope:** real customer data, authentication, persistent storage,
server-side processing, integration with live credit bureaus or core banking
systems. The portfolio risk trend chart uses generated sample data to
illustrate trend visualisation, since no historical snapshots exist
client-side.
