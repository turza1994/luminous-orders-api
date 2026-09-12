import {
    pgEnum,
    pgTable,
    serial,
    varchar,
    timestamp,
    numeric,
    index,
    integer
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);

export const orderStatusEnum = pgEnum("order_status", [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "COMPLETED",
    "CANCELLED",
]);

export const users = pgTable("users", {
    id: serial("id").primaryKey(),

    email: varchar("email", { length: 255 }).notNull().unique(),

    passwordHash: varchar("password_hash", { length: 255 }).notNull(),

    role: userRoleEnum("role").notNull().default("USER"),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .notNull()
        .defaultNow(),
});

export const orders = pgTable(
    "orders",
    {
        id: serial("id").primaryKey(),

        userId: integer("user_id")
            .notNull()
            .references(() => users.id, {
                onDelete: "cascade",
            }),

        status: orderStatusEnum("status").notNull(),

        totalAmount: numeric("total_amount", {
            precision: 12,
            scale: 2,
        }).notNull(),

        createdAt: timestamp("created_at", {
            withTimezone: true,
        })
            .notNull()
            .defaultNow(),
    },
    (table) => [
        index("orders_user_created_at_idx").on(
            table.userId,
            table.createdAt,
        ),
    ],
);