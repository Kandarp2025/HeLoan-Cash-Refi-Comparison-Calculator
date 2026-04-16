"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitedFinancialPayloadSchema = void 0;
const zod_1 = require("zod");
const nonNegativeNumber = zod_1.z.number().min(0, "Must be greater than or equal to 0");
exports.unitedFinancialPayloadSchema = zod_1.z.object({
    homeValue: nonNegativeNumber,
    currentMortgageBalance: nonNegativeNumber,
    cashRefiRate15: nonNegativeNumber,
    cashRefiRate30: nonNegativeNumber,
    cashRefiFeePercent: nonNegativeNumber,
    cashRefiFlatFee: nonNegativeNumber,
    heloanAmount: nonNegativeNumber,
    heloanRate: nonNegativeNumber,
    heloanRepaymentYears: zod_1.z.union([zod_1.z.literal(10), zod_1.z.literal(15), zod_1.z.literal(20), zod_1.z.literal(30)]),
    heloanFeePercent: nonNegativeNumber,
    heloanFlatFee: nonNegativeNumber
});
//# sourceMappingURL=unitedFinancial.validator.js.map