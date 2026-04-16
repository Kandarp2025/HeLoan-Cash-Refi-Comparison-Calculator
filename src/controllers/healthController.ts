import { Request, Response } from "express";
import { getHealthStatus } from "../services/healthService";

export const healthController = (_req: Request, res: Response): void => {
  res.status(200).json(getHealthStatus());
};
