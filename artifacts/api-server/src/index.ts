import app from "./app";
import { logger } from "./lib/logger";
import { seedProducts } from "./lib/seedProducts";
import { startMatchPoller } from "./lib/matchPoller";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  try {
    await seedProducts();
  } catch (e) {
    logger.warn({ err: e }, "Product seeding failed (non-fatal)");
  }

  try {
    startMatchPoller();
  } catch (e) {
    logger.warn({ err: e }, "Match poller failed to start (non-fatal)");
  }
});
