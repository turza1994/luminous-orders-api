import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../config/constants.js";
import { loginBodySchema } from "./login.schema.js";
import { login } from "./auth.service.js";

export async function handleLogin(req: Request, res: Response) {
    const { email, password } = loginBodySchema.parse(req.body);

    const result = await login(email, password);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
    });
}
