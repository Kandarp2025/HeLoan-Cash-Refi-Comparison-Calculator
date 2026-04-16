"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealthStatus = void 0;
const env_1 = require("../config/env");
const getHealthStatus = () => {
    return {
        status: "ok",
        service: env_1.env.serviceName,
        timestamp: new Date().toISOString()
    };
};
exports.getHealthStatus = getHealthStatus;
//# sourceMappingURL=healthService.js.map