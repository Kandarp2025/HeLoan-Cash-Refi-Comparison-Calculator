import { Router } from "express";
import {
  calculateUnitedFinancialComparison,
  previewUnitedFinancialWebhook,
  renderUnitedFinancialComparisonHtmlResponse,
  validateUnitedFinancialPayload
} from "../controllers/unitedFinancialController";
import { validateRequest } from "../middleware/validateRequest";
import { unitedFinancialPayloadSchema } from "../validators/unitedFinancial.validator";

const unitedFinancialRoutes = Router();

unitedFinancialRoutes.post(
  "/api/united-financial/webhook-preview",
  previewUnitedFinancialWebhook
);

unitedFinancialRoutes.post(
  "/api/united-financial/validate-only",
  validateRequest(unitedFinancialPayloadSchema),
  validateUnitedFinancialPayload
);

unitedFinancialRoutes.post(
  "/api/united-financial/calculate",
  validateRequest(unitedFinancialPayloadSchema),
  calculateUnitedFinancialComparison
);

unitedFinancialRoutes.post(
  "/api/united-financial/render-html",
  validateRequest(unitedFinancialPayloadSchema),
  renderUnitedFinancialComparisonHtmlResponse
);

export default unitedFinancialRoutes;
