import { Router } from "express";

import { asyncErrorWrapper } from "../../middleware/async-error-wrapper.js";
import { handleLogin } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", asyncErrorWrapper(handleLogin));
