import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

export const validateRequest =
  <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction): void => {
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
