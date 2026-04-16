"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const parsePort = (value) => {
    if (!value)
        return 3000;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 3000 : parsed;
};
exports.env = {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: parsePort(process.env.PORT),
    serviceName: "united-financial-render-service"
};
//# sourceMappingURL=env.js.map