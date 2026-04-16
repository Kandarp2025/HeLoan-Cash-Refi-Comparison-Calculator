import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import morgan from "morgan";
import healthRoutes from "./routes/healthRoutes";
import unitedFinancialRoutes from "./routes/unitedFinancialRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use(healthRoutes);
app.use(unitedFinancialRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
