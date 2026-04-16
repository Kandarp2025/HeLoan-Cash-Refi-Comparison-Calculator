import app from "./app";
import { env } from "./config/env";

app.listen(env.port, () => {
  // Keeping startup logs explicit helps basic ops visibility.
  console.log(
    `[${env.serviceName}] listening on port ${env.port} in ${env.nodeEnv} mode`
  );
});
