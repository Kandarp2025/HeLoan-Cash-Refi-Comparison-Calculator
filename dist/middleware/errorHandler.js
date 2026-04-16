"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
    const statusCode = err.statusCode ?? 500;
    res.status(statusCode).json({
        status: "error",
        message: err.message || "Internal server error"
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map