"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = void 0;
const healthService_1 = require("../services/healthService");
const healthController = (_req, res) => {
    res.status(200).json((0, healthService_1.getHealthStatus)());
};
exports.healthController = healthController;
//# sourceMappingURL=healthController.js.map