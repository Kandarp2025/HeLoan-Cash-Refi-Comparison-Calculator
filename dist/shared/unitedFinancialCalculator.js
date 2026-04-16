"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.monthlyPayment = monthlyPayment;
exports.calculateAPR = calculateAPR;
exports.maxCashOut = maxCashOut;
exports.calculateComparison = calculateComparison;
function monthlyPayment(principal, annualRate, years) {
    const monthlyRate = annualRate / 100 / 12;
    const n = years * 12;
    if (!principal || !n)
        return 0;
    if (monthlyRate === 0)
        return principal / n;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, n)) /
        (Math.pow(1 + monthlyRate, n) - 1);
}
function calculateAPR(loanAmount, payment, months, fees) {
    const amountReceived = loanAmount - fees;
    let low = 0;
    let high = 1;
    for (let i = 0; i < 50; i++) {
        const mid = (low + high) / 2;
        let pv = 0;
        for (let t = 1; t <= months; t++) {
            pv += payment / Math.pow(1 + mid / 12, t);
        }
        if (pv > amountReceived)
            low = mid;
        else
            high = mid;
    }
    return ((low + high) / 2) * 100;
}
function maxCashOut(homeValue, currentBalance, maxCltv = 80) {
    const maxLoan = homeValue * (maxCltv / 100);
    return Math.max(maxLoan - currentBalance, 0);
}
function calculateComparison(inputs) {
    const maxAvailableCash = maxCashOut(inputs.homeValue, inputs.currentMortgageBalance, 80);
    const matchedCashAmount = Math.min(inputs.heloanAmount, maxAvailableCash);
    const estimatedBaseNewLoanBalance = inputs.currentMortgageBalance + matchedCashAmount;
    const cashRefiFees = estimatedBaseNewLoanBalance * (inputs.cashRefiFeePercent / 100) + inputs.cashRefiFlatFee;
    const cashRefiLoanBalance = estimatedBaseNewLoanBalance + cashRefiFees;
    const cashRefi15Payment = monthlyPayment(cashRefiLoanBalance, inputs.cashRefiRate15, 15);
    const cashRefi30Payment = monthlyPayment(cashRefiLoanBalance, inputs.cashRefiRate30, 30);
    const cashRefi15Apr = calculateAPR(cashRefiLoanBalance, cashRefi15Payment, 15 * 12, cashRefiFees);
    const cashRefi30Apr = calculateAPR(cashRefiLoanBalance, cashRefi30Payment, 30 * 12, cashRefiFees);
    const heloanFees = matchedCashAmount * (inputs.heloanFeePercent / 100) + inputs.heloanFlatFee;
    const heloanLoanBalance = matchedCashAmount + heloanFees;
    const heloanPayment = monthlyPayment(heloanLoanBalance, inputs.heloanRate, inputs.heloanRepaymentYears);
    const heloanApr = calculateAPR(heloanLoanBalance, heloanPayment, inputs.heloanRepaymentYears * 12, heloanFees);
    return {
        maxAvailableCash,
        matchedCashAmount,
        heloan: {
            scenario: `HELOAN ${inputs.heloanRepaymentYears}-Year`,
            cashReceived: matchedCashAmount,
            loanBalance: heloanLoanBalance,
            monthlyPayment: heloanPayment,
            interestRate: inputs.heloanRate,
            apr: heloanApr,
        },
        cashRefi15: {
            scenario: "Cash Refi 15-Year",
            cashReceived: matchedCashAmount,
            loanBalance: cashRefiLoanBalance,
            monthlyPayment: cashRefi15Payment,
            interestRate: inputs.cashRefiRate15,
            apr: cashRefi15Apr,
        },
        cashRefi30: {
            scenario: "Cash Refi 30-Year",
            cashReceived: matchedCashAmount,
            loanBalance: cashRefiLoanBalance,
            monthlyPayment: cashRefi30Payment,
            interestRate: inputs.cashRefiRate30,
            apr: cashRefi30Apr,
        },
    };
}
//# sourceMappingURL=unitedFinancialCalculator.js.map