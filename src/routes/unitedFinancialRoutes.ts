import { Router } from "express";
import {
  calculateUnitedFinancialComparison,
  previewUnitedFinancialWebhook,
  processUnitedFinancialWebhook,
  renderUnitedFinancialComparisonImageResponse,
  renderUnitedFinancialComparisonHtmlResponse,
  searchCustomerRecord,
  updateCustomerRecord,
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
  "/api/united-financial/comparison/compute",
  processUnitedFinancialWebhook
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

unitedFinancialRoutes.post(
  "/api/united-financial/render-image",
  validateRequest(unitedFinancialPayloadSchema),
  renderUnitedFinancialComparisonImageResponse
);

unitedFinancialRoutes.get(
  "/api/united-financial/customer-record",
  searchCustomerRecord
);

unitedFinancialRoutes.put(
  "/api/united-financial/customer-record/:id",
  updateCustomerRecord
);

export default unitedFinancialRoutes;
