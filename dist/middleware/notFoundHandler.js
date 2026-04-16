"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = void 0;
const notFoundHandler = (req, res, _next) => {
    res.status(404).json({
        status: "error",
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=notFoundHandler.js.map