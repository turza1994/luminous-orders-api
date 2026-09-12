import { UserRepository } from "../auth/users.repository.js";
import { OrderRepository } from "./orders.repository.js";
import { AppError } from "../../errors/app-error.js";
import { ERROR_CODES } from "../../errors/error-codes.js";
import { HTTP_STATUS, USER_ROLES } from "../../config/constants.js";

export async function getUserOrders(
    requestedUserId: number,
    authenticatedUser: { id: number; role: "USER" | "ADMIN" },
) {
    // Check that the user exists
    const user = await UserRepository.findById(requestedUserId);

    if (!user) {
        throw new AppError(
            HTTP_STATUS.NOT_FOUND,
            ERROR_CODES.USER_NOT_FOUND,
            "User not found.",
        );
    }

    // Authorization: user can only access own orders, admins can access any
    const isSelf = authenticatedUser.id === requestedUserId;
    const isAdmin = authenticatedUser.role === USER_ROLES.ADMIN;

    if (!isSelf && !isAdmin) {
        throw new AppError(
            HTTP_STATUS.FORBIDDEN,
            ERROR_CODES.ORDER_HISTORY_ACCESS_DENIED,
            "You do not have permission to view this user's orders.",
        );
    }

    // Fetch orders newest first using the composite index
    const userOrders = await OrderRepository.findByUserId(requestedUserId);

    return userOrders;
}
