import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";

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

vi.mock("../src/modules/auth/auth.service.js", () => ({
    login: vi.fn(),
}));

import { app } from "../src/app.js";
import { login } from "../src/modules/auth/auth.service.js";

const mockLogin = vi.mocked(login);

describe("POST /api/auth/login", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns 200 with token on valid credentials", async () => {
        mockLogin.mockResolvedValue({
            token: "mock-jwt-token",
            user: { id: 1, email: "alice@example.com", role: "USER" },
        });

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "alice@example.com", password: "password123" });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.token).toBe("mock-jwt-token");
        expect(res.body.data.user).toEqual({
            id: 1,
            email: "alice@example.com",
            role: "USER",
        });
        expect(mockLogin).toHaveBeenCalledWith(
            "alice@example.com",
            "password123",
        );
    });

    it("returns 401 on invalid credentials", async () => {
        mockLogin.mockRejectedValue(
            new (await import("../src/errors/app-error.js")).AppError(
                401,
                "UNAUTHORIZED",
                "Invalid email or password.",
            ),
        );

        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "alice@example.com", password: "wrong" });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 400 when email is missing", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ password: "password123" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("INVALID_REQUEST");
    });

    it("returns 400 when password is missing", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "alice@example.com" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("INVALID_REQUEST");
    });

    it("returns 400 when body is not a JSON object", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send("not-json");

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("INVALID_REQUEST");
    });

    it("returns 400 when email is empty string", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "", password: "password123" });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe("INVALID_REQUEST");
    });
});
