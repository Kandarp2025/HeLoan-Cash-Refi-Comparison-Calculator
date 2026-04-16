import { env } from "../config/env";
import { HealthResponse } from "../types/http";

export const getHealthStatus = (): HealthResponse => {
  return {
    status: "ok",
    service: env.serviceName,
    timestamp: new Date().toISOString()
  };
};
