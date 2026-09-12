import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware.js";
import { asyncErrorWrapper } from "../../middleware/async-error-wrapper.js";
import { handleGetUserOrders } from "./orders.controller.js";

export const ordersRouter = Router();

ordersRouter.get(
    "/:id/orders",
    authenticate,
    asyncErrorWrapper(handleGetUserOrders),
);
