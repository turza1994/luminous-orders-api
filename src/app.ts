import express from "express";
import cors from "cors";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/not-found.middleware.js";

export const app = express();

app.use(helmet());

app.use(
    cors({
        origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN,
    }),
);

app.use(express.json());

app.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        data: {
            status: "ok",
        },
    });
});

app.use(notFoundMiddleware);
app.use(errorMiddleware);