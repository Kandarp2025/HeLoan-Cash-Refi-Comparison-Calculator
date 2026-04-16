export type ApiStatus = "ok" | "error";

export interface HealthResponse {
  status: ApiStatus;
  service: string;
  timestamp: string;
}
