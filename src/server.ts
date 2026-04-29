import app from "./app";
import { env } from "./config/env";
import { connectDb } from "./config/db";

const startServer = async (): Promise<void> => {
  app.listen(env.port, () => {
    // Keeping startup logs explicit helps basic ops visibility.
    console.log(
      `[${env.serviceName}] listening on port ${env.port} in ${env.nodeEnv} mode`
    );
  });

  void connectDb()
    .then(() => {
      console.log(`[${env.serviceName}] database connection established`);
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown database startup error";
      console.error(`[${env.serviceName}] database connection failed at startup:`, message);
    });
};

void startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error(`[${env.serviceName}] startup failed:`, message);
  process.exit(1);
});
