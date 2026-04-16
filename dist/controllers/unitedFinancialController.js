"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.previewUnitedFinancialWebhook = exports.renderUnitedFinancialComparisonHtmlResponse = exports.calculateUnitedFinancialComparison = exports.validateUnitedFinancialPayload = void 0;
const unitedFinancialCalculator_service_1 = require("../services/unitedFinancialCalculator.service");
const unitedFinancialComparison_template_1 = require("../templates/unitedFinancialComparison.template");
const unitedFinancialWebhookNormalizer_service_1 = require("../services/unitedFinancialWebhookNormalizer.service");
const unitedFinancial_validator_1 = require("../validators/unitedFinancial.validator");
const validateUnitedFinancialPayload = (req, res) => {
    res.status(200).json({
        success: true,
        data: req.body
    });
};
exports.validateUnitedFinancialPayload = validateUnitedFinancialPayload;
const calculateUnitedFinancialComparison = (req, res) => {
    const result = (0, unitedFinancialCalculator_service_1.runUnitedFinancialCalculation)(req.body);
    res.status(200).json({
        success: true,
        data: result
    });
};
exports.calculateUnitedFinancialComparison = calculateUnitedFinancialComparison;
const renderUnitedFinancialComparisonHtmlResponse = (req, res) => {
    const result = (0, unitedFinancialCalculator_service_1.runUnitedFinancialCalculation)(req.body);
    const html = (0, unitedFinancialComparison_template_1.renderUnitedFinancialComparisonHtml)(result);
    res.status(200).type("text/html").send(html);
};
exports.renderUnitedFinancialComparisonHtmlResponse = renderUnitedFinancialComparisonHtmlResponse;
const previewUnitedFinancialWebhook = (req, res) => {
    const rawPayload = req.body;
    const normalization = (0, unitedFinancialWebhookNormalizer_service_1.normalizeUnitedFinancialWebhookPayload)(rawPayload);
    if (!normalization.success) {
        res.status(400).json({
            success: false,
            message: "Unable to normalize webhook payload into calculator input",
            meta: normalization.meta,
            rawPayload,
            errors: normalization.errors
        });
        return;
    }
    const normalizedPayload = normalization.normalizedPayload;
    const validation = unitedFinancial_validator_1.unitedFinancialPayloadSchema.safeParse(normalizedPayload);
    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Normalized payload failed calculator validation",
            meta: normalization.meta,
            rawPayload,
            normalizedPayload,
            errors: validation.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });
        return;
    }
    const result = (0, unitedFinancialCalculator_service_1.runUnitedFinancialCalculation)(validation.data);
    const html = (0, unitedFinancialComparison_template_1.renderUnitedFinancialComparisonHtml)(result);
    res.status(200).json({
        success: true,
        meta: normalization.meta,
        rawPayload,
        normalizedPayload: validation.data,
        result,
        html
    });
};
exports.previewUnitedFinancialWebhook = previewUnitedFinancialWebhook;
//# sourceMappingURL=unitedFinancialController.js.map