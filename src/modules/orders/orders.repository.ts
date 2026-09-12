import { eq, desc } from "drizzle-orm";

import { db } from "../../db/index.js";
import { orders } from "../../db/schema.js";

export const OrderRepository = {
    async findByUserId(userId: number) {
        const userOrders = await db
            .select({
                id: orders.id,
                userId: orders.userId,
                status: orders.status,
                totalAmount: orders.totalAmount,
                createdAt: orders.createdAt,
            })
            .from(orders)
            .where(eq(orders.userId, userId))
            .orderBy(desc(orders.createdAt));

        return userOrders;
    },
};
