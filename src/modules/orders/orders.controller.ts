import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../config/constants.js";
import { AppError } from "../../errors/app-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import { userIdParamSchema } from "./params.schema.js";
import { getUserOrders } from "./orders.service.js";

export async function handleGetUserOrders(req: Request, res: Response) {
    const { id } = userIdParamSchema.parse(req.params);

    if (!req.user) {
        throw new AppError(
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_CODES.UNAUTHORIZED,
            "Authentication required.",
        );
    }

    const userOrders = await getUserOrders(id, req.user);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: { orders: userOrders },
    });
}
