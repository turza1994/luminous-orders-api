import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const server = app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
});

const shutdown = (signal: string) => {
    logger.info(`${signal} received. Shutting down...`);

    server.close(() => {
        logger.info("HTTP server closed.");
        process.exit(0);
    });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
