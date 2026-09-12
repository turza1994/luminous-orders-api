import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";
import { HTTP_STATUS } from "../config/constants.js";
import { logger } from "../utils/logger.js";

export const errorMiddleware: ErrorRequestHandler = (
    error,
    _req,
    res,
    _next,
) => {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({
            success: false,
            error: {
                code: error.code,
                message: error.message,
            },
        });

        return;
    }

    if (error instanceof ZodError) {
        const message = error.issues
            .map((issue) => issue.message)
            .join("; ");

        res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: {
                code: ERROR_CODES.INVALID_REQUEST,
                message,
            },
        });

        return;
    }

    logger.error("Unexpected error", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
    });

    res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message:
                env.NODE_ENV === "production"
                    ? "An unexpected error occurred."
                    : error instanceof Error
                        ? error.message
                        : "An unexpected error occurred.",
        },
    });
};
