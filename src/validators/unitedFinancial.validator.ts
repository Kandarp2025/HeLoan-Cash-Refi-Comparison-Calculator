import { z } from "zod";
import { UnitedFinancialCalculatorInput } from "../types/unitedFinancial.types";

const nonNegativeNumber = z.number().min(0, "Must be greater than or equal to 0");

export const unitedFinancialPayloadSchema = z.object({
  homeValue: nonNegativeNumber,
  currentMortgageBalance: nonNegativeNumber,
  cashRefiRate15: nonNegativeNumber,
  cashRefiRate30: nonNegativeNumber,
  cashRefiFeePercent: nonNegativeNumber,
  cashRefiFlatFee: nonNegativeNumber,
  heloanAmount: nonNegativeNumber,
  heloanRate: nonNegativeNumber,
  heloanRepaymentYears: z.union([z.literal(10), z.literal(15), z.literal(20), z.literal(30)]),
  heloanFeePercent: nonNegativeNumber,
  heloanFlatFee: nonNegativeNumber
}) satisfies z.ZodType<UnitedFinancialCalculatorInput>;
