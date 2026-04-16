"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => (req, res, next) => {
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({
            status: "error",
            message: "Validation failed",
            errors: validation.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message
            }))
        });
        return;
    }
    req.body = validation.data;
    next();
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validateRequest.js.map