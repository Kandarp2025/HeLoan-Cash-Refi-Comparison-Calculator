import { CalculatorResult, ComparisonRow } from "../shared/unitedFinancialCalculator";

export interface ComparisonResultMeta {
  name?: string;
  email?: string;
  phone?: string;
}

export interface BuildComparisonResultHtmlParams {
  result: CalculatorResult;
  meta?: ComparisonResultMeta;
  generatedAt?: string;
}

const usdWholeFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

const usdMonthlyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const renderRow = (row: ComparisonRow, highlight = false): string => `
  <tr${highlight ? ' class="highlight"' : ""}>
    <td class="scenario">${escapeHtml(row.scenario)}</td>
    <td>${usdWholeFormatter.format(row.cashReceived)}</td>
    <td>${usdWholeFormatter.format(row.loanBalance)}</td>
    <td>${usdMonthlyFormatter.format(row.monthlyPayment)}</td>
    <td>${percentFormatter.format(row.interestRate)}%</td>
    <td>${percentFormatter.format(row.apr)}%</td>
  </tr>
`;

const renderMetaRow = (label: string, value?: string): string => {
  if (!value || !value.trim()) {
    return "";
  }
  return `<div class="meta-row"><span class="meta-label">${label}:</span> <span class="meta-value">${escapeHtml(value)}</span></div>`;
};

export const buildComparisonResultHtml = (
  params: BuildComparisonResultHtmlParams
): string => {
  const { result, meta, generatedAt } = params;
  const generatedLabel = generatedAt
    ? new Date(generatedAt).toLocaleString("en-US")
    : new Date().toLocaleString("en-US");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>United Financial Comparison Result</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 32px;
        background: #f5f7fb;
        font-family: -apple-system, "Segoe UI", Arial, sans-serif;
        color: #0f172a;
      }
      .card {
        max-width: 1100px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        padding: 32px;
      }
      .header {
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 20px;
        margin-bottom: 24px;
      }
      h1 {
        margin: 0 0 6px 0;
        font-size: 26px;
        color: #0b1f4a;
      }
      .subtitle {
        margin: 0;
        color: #475569;
        font-size: 14px;
      }
      .meta {
        margin-top: 16px;
        font-size: 14px;
        color: #1e293b;
      }
      .meta-row {
        margin: 4px 0;
      }
      .meta-label {
        color: #64748b;
        font-weight: 600;
      }
      .summary {
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
      }
      .summary-item {
        flex: 1;
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px 20px;
      }
      .summary-label {
        font-size: 13px;
        color: #475569;
        margin-bottom: 6px;
      }
      .summary-value {
        font-size: 20px;
        font-weight: 700;
        color: #0b1f4a;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
        border: 1px solid #dbe3ef;
        border-radius: 12px;
        overflow: hidden;
      }
      thead th {
        background: #0b1f4a;
        color: #ffffff;
        text-align: left;
        padding: 14px 16px;
        font-weight: 600;
        font-size: 13px;
        letter-spacing: 0.02em;
      }
      tbody td {
        padding: 14px 16px;
        border-top: 1px solid #e2e8f0;
      }
      tbody tr.highlight {
        background: #f1f5f9;
      }
      td.scenario {
        font-weight: 600;
        color: #0b1f4a;
      }
      .footer {
        margin-top: 20px;
        font-size: 12px;
        color: #94a3b8;
        text-align: right;
      }
    </style>
  </head>
  <body>
    <section class="card">
      <div class="header">
        <h1>Comparison Result</h1>
        <p class="subtitle">HELOAN vs. Cash Refi 15-Year vs. Cash Refi 30-Year</p>
        <div class="meta">
          ${renderMetaRow("Name", meta?.name)}
          ${renderMetaRow("Email", meta?.email)}
          ${renderMetaRow("Phone", meta?.phone)}
        </div>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="summary-label">Max Available Cash</div>
          <div class="summary-value">${usdWholeFormatter.format(result.maxAvailableCash)}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">Matched Cash Amount</div>
          <div class="summary-value">${usdWholeFormatter.format(result.matchedCashAmount)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Cash Received</th>
            <th>Loan Balance</th>
            <th>Monthly Payment</th>
            <th>Interest Rate</th>
            <th>APR</th>
          </tr>
        </thead>
        <tbody>
          ${renderRow(result.heloan)}
          ${renderRow(result.cashRefi15, true)}
          ${renderRow(result.cashRefi30)}
        </tbody>
      </table>

      <div class="footer">Generated ${escapeHtml(generatedLabel)}</div>
    </section>
  </body>
</html>`;
};
