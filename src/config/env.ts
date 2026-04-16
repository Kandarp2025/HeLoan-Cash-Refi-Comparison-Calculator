import dotenv from "dotenv";

dotenv.config();

const parsePort = (value: string | undefined): number => {
  if (!value) return 3000;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 3000 : parsed;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT),
  serviceName: "united-financial-render-service"
};
