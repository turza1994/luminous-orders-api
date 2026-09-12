import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

import { HTTP_STATUS } from "../config/constants.js";
import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { ERROR_CODES } from "../errors/error-codes.js";

interface JwtPayload {
    sub: string;
    role: "USER" | "ADMIN";
}

export const authenticate: RequestHandler = (req, _res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        next(
            new AppError(
                HTTP_STATUS.UNAUTHORIZED,
                ERROR_CODES.UNAUTHORIZED,
                "Missing or malformed Authorization header.",
            ),
        );
        return;
    }

    const token = authHeader.slice(7);

    try {
        const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

        req.user = {
            id: parseInt(payload.sub, 10),
            role: payload.role,
        };

        next();
    } catch {
        next(
            new AppError(
                HTTP_STATUS.UNAUTHORIZED,
                ERROR_CODES.INVALID_TOKEN,
                "Invalid or expired token.",
            ),
        );
    }
};
