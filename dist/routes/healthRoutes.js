"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthController_1 = require("../controllers/healthController");
const healthRoutes = (0, express_1.Router)();
healthRoutes.get("/health", healthController_1.healthController);
exports.default = healthRoutes;
//# sourceMappingURL=healthRoutes.js.map