import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const JWT_SECRET = "test-secret-key-that-is-at-least-32-chars-long!";

// Mock env before any imports that trigger validation
vi.mock("../src/config/env.js", () => ({
    env: {
        NODE_ENV: "test",
        PORT: 5000,
        DATABASE_URL: "postgresql://test:test@localhost:5432/test",
        JWT_SECRET: "test-secret-key-that-is-at-least-32-chars-long!",
        JWT_EXPIRES_IN: "1h",
        CORS_ORIGIN: "*",
    },
}));

vi.mock("../src/db/index.js", () => ({
    db: { select: vi.fn(), insert: vi.fn(), delete: vi.fn() },
}));

vi.mock("../src/modules/orders/orders.service.js", () => ({
    getUserOrders: vi.fn(),
}));

import { app } from "../src/app.js";
import { getUserOrders } from "../src/modules/orders/orders.service.js";

const mockGetUserOrders = vi.mocked(getUserOrders);

function signToken(payload: { sub: string; role: "USER" | "ADMIN" }): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
}

describe("Authentication", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 401 when Authorization header is missing", async () => {
        const res = await request(app).get("/api/users/1/orders");

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 when token is malformed", async () => {
        const res = await request(app)
            .get("/api/users/1/orders")
            .set("Authorization", "Bearer not-a-valid-jwt");

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("INVALID_TOKEN");
    });

    it("returns 401 when token is signed with wrong secret", async () => {
        const token = jwt.sign(
            { sub: "1", role: "USER" },
            "wrong-secret-key-12345678901234",
            { expiresIn: "1h" },
        );

        const res = await request(app)
            .get("/api/users/1/orders")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("INVALID_TOKEN");
    });
});

describe("GET /api/users/:id/orders", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 200 with orders for authenticated user accessing own orders", async () => {
        const token = signToken({ sub: "1", role: "USER" });
        const mockOrders = [
            {
                id: 3,
                userId: 1,
                status: "PENDING" as const,
                totalAmount: "210.00",
                createdAt: new Date("2025-03-10T09:00:00Z"),
            },
            {
                id: 1,
                userId: 1,
                status: "COMPLETED" as const,
                totalAmount: "129.99",
                createdAt: new Date("2025-01-15T10:30:00Z"),
            },
        ];
        mockGetUserOrders.mockResolvedValue(mockOrders);

        const res = await request(app)
            .get("/api/users/1/orders")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.orders).toHaveLength(2);
    });

    it("returns orders newest first", async () => {
        const token = signToken({ sub: "1", role: "USER" });
        const mockOrders = [
            {
                id: 5,
                userId: 1,
                status: "CANCELLED" as const,
                totalAmount: "89.00",
                createdAt: new Date("2025-05-18T11:20:00Z"),
            },
            {
                id: 4,
                userId: 1,
                status: "COMPLETED" as const,
                totalAmount: "35.75",
                createdAt: new Date("2025-04-05T16:45:00Z"),
            },
            {
                id: 3,
                userId: 1,
                status: "PENDING" as const,
                totalAmount: "210.00",
                createdAt: new Date("2025-03-10T09:00:00Z"),
            },
        ];
        mockGetUserOrders.mockResolvedValue(mockOrders);

        const res = await request(app)
            .get("/api/users/1/orders")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.orders).toHaveLength(3);

        const dates = res.body.data.orders.map(
            (o: { createdAt: string }) => new Date(o.createdAt).getTime(),
        );
        for (let i = 1; i < dates.length; i++) {
            expect(dates[i - 1]!).toBeGreaterThanOrEqual(dates[i]!);
        }
    });

    it("returns 200 with empty array for user with no orders", async () => {
        const token = signToken({ sub: "3", role: "USER" });
        mockGetUserOrders.mockResolvedValue([]);

        const res = await request(app)
            .get("/api/users/3/orders")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.orders).toEqual([]);
    });

    it("returns 404 for nonexistent user", async () => {
        const token = signToken({ sub: "1", role: "USER" });
        const { AppError } = await import("../src/errors/app-error.js");
        mockGetUserOrders.mockRejectedValue(
            new AppError(404, "USER_NOT_FOUND", "User not found."),
        );

        const res = await request(app)
            .get("/api/users/99999/orders")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("USER_NOT_FOUND");
    });

    it("returns 403 when user tries to access another user's orders", async () => {
        const token = signToken({ sub: "1", role: "USER" });
        const { AppError } = await import("../src/errors/app-error.js");
        mockGetUserOrders.mockRejectedValue(
            new AppError(
                403,
                "ORDER_HISTORY_ACCESS_DENIED",
                "You do not have permission to view this user's orders.",
            ),
        );

        const res = await request(app)
            .get("/api/users/2/orders")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("ORDER_HISTORY_ACCESS_DENIED");
    });

    it("returns 200 when admin accesses another user's orders", async () => {
        const token = signToken({ sub: "99", role: "ADMIN" });
        const mockOrders = [
            {
                id: 1,
                userId: 2,
                status: "COMPLETED" as const,
                totalAmount: "199.99",
                createdAt: new Date("2025-02-14T12:00:00Z"),
            },
        ];
        mockGetUserOrders.mockResolvedValue(mockOrders);

        const res = await request(app)
            .get("/api/users/2/orders")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.orders).toHaveLength(1);
        expect(res.body.data.orders[0]!.id).toBe(1);
        expect(res.body.data.orders[0]!.userId).toBe(2);
    });

    it("returns 400 for invalid user ID", async () => {
        const token = signToken({ sub: "1", role: "USER" });

        const res = await request(app)
            .get("/api/users/abc/orders")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("INVALID_REQUEST");
    });

    it("returns 400 for negative user ID", async () => {
        const token = signToken({ sub: "1", role: "USER" });

        const res = await request(app)
            .get("/api/users/-1/orders")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("INVALID_REQUEST");
    });
});
