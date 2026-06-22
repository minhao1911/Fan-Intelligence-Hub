import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import fixturesRouter from "./routes/fixtures";
import adminRouter from "./routes/admin";
import { logger } from "./lib/logger";
import { globalLimiter, writeLimiter } from "./middlewares/rateLimiter";
import { getUserInfo } from "@replit/repl-auth";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Inject Replit Auth user onto every request
app.use((req, _res, next) => {
  try {
    const identity = getUserInfo(req as any);
    if (identity?.id) {
      (req as any).replitUser = identity;
    }
  } catch {
    // not authenticated — continue without user
  }
  next();
});

// Rate limiting
app.use("/api", globalLimiter);
app.use("/api", (req, res, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return writeLimiter(req, res, next);
  }
  return next();
});

app.use("/api", fixturesRouter);
app.use("/api", router);
app.use("/api", adminRouter);

export default app;
