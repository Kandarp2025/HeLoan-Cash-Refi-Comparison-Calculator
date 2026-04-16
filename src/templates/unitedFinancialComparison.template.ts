import { CalculatorResult, ComparisonRow } from "../shared/unitedFinancialCalculator";

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
  minimumFractionDigits: 3,
  maximumFractionDigits: 3
});

const renderRow = (row: ComparisonRow, rowClassName = ""): string => {
  return `
    <tr class="${rowClassName}">
      <td>${row.scenario}</td>
      <td>${usdWholeFormatter.format(row.cashReceived)}</td>
      <td>${usdWholeFormatter.format(row.loanBalance)}</td>
      <td>${usdMonthlyFormatter.format(row.monthlyPayment)}</td>
      <td>${percentFormatter.format(row.interestRate)}%</td>
      <td>${percentFormatter.format(row.apr)}%</td>
    </tr>
  `;
};

export const renderUnitedFinancialComparisonHtml = (
  result: CalculatorResult
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>United Financial Comparison</title>
    <style>
      body {
        margin: 0;
        padding: 32px;
        background: #f5f7fb;
        font-family: "Segoe UI", Arial, sans-serif;
        color: #0f172a;
      }

      #comparisonCard {
        max-width: 1100px;
        margin: 0 auto;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
        padding: 24px;
      }

      h2 {
        margin: 0 0 8px 0;
        font-size: 28px;
        line-height: 1.2;
      }

      .subtitle {
        margin: 0 0 20px 0;
        color: #475569;
        font-size: 15px;
        line-height: 1.4;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
        font-size: 15px;
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
      }

      tbody td {
        padding: 14px 16px;
        border-top: 1px solid #e2e8f0;
      }

      tbody tr:nth-child(2) {
        background: #f1f5f9;
      }
    </style>
  </head>
  <body>
    <section id="comparisonCard">
      <h2>Comparison Table</h2>
      <p class="subtitle">
        Side-by-side comparison of HELOAN, Cash Refi 15-year, and Cash Refi 30-year using the information entered above.
      </p>
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
          ${renderRow(result.cashRefi15, "middle-row")}
          ${renderRow(result.cashRefi30)}
        </tbody>
      </table>
    </section>
  </body>
</html>
  `;
};
