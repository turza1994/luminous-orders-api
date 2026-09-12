import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { UserRepository } from "./users.repository.js";
import { AppError } from "../../errors/app-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import { HTTP_STATUS } from "../../config/constants.js";
import { env } from "../../config/env.js";

export async function login(email: string, password: string) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
        throw new AppError(
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_CODES.UNAUTHORIZED,
            "Invalid email or password.",
        );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
        throw new AppError(
            HTTP_STATUS.UNAUTHORIZED,
            ERROR_CODES.UNAUTHORIZED,
            "Invalid email or password.",
        );
    }

    const token = jwt.sign(
        { sub: String(user.id), role: user.role } satisfies jwt.JwtPayload,
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions,
    );

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
        },
    };
}
