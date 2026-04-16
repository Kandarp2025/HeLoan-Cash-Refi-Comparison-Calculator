import {
  CalculatorInputs,
  CalculatorResult,
  calculateComparison
} from "../shared/unitedFinancialCalculator";

export const runUnitedFinancialCalculation = (
  input: CalculatorInputs
): CalculatorResult => {
  return calculateComparison(input);
};
