"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const unitedFinancialController_1 = require("../controllers/unitedFinancialController");
const validateRequest_1 = require("../middleware/validateRequest");
const unitedFinancial_validator_1 = require("../validators/unitedFinancial.validator");
const unitedFinancialRoutes = (0, express_1.Router)();
unitedFinancialRoutes.post("/api/united-financial/webhook-preview", unitedFinancialController_1.previewUnitedFinancialWebhook);
unitedFinancialRoutes.post("/api/united-financial/validate-only", (0, validateRequest_1.validateRequest)(unitedFinancial_validator_1.unitedFinancialPayloadSchema), unitedFinancialController_1.validateUnitedFinancialPayload);
unitedFinancialRoutes.post("/api/united-financial/calculate", (0, validateRequest_1.validateRequest)(unitedFinancial_validator_1.unitedFinancialPayloadSchema), unitedFinancialController_1.calculateUnitedFinancialComparison);
unitedFinancialRoutes.post("/api/united-financial/render-html", (0, validateRequest_1.validateRequest)(unitedFinancial_validator_1.unitedFinancialPayloadSchema), unitedFinancialController_1.renderUnitedFinancialComparisonHtmlResponse);
exports.default = unitedFinancialRoutes;
//# sourceMappingURL=unitedFinancialRoutes.js.map