import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/config/env.js", () => ({
    env: {
        NODE_ENV: "test",
        PORT: 5000,
        DATABASE_URL: "postgresql://test:test@localhost:5432/test",
        JWT_SECRET: "test-secret-key-that-is-at-least-32-chars-long!",
        JWT_EXPIRES_IN: "1h",
        CORS_ORIGIN: "*",
    },
}));

vi.mock("../../../src/repositories/UserRepository.js", () => ({
    UserRepository: {
        findByEmail: vi.fn(),
        findById: vi.fn(),
    },
}));

import { UserRepository } from "../../../src/modules/auth/users.repository.js";
import { login } from "../../../src/modules/auth/auth.service.js";
import { AppError } from "../../../src/errors/app-error.js";

const mockFindByEmail = vi.mocked(UserRepository.findByEmail);

describe("AuthService.login", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("calls UserRepository.findByEmail with the provided email", async () => {
        mockFindByEmail.mockResolvedValue(null);

        await expect(
            login("alice@example.com", "password123"),
        ).rejects.toThrow();

        expect(mockFindByEmail).toHaveBeenCalledWith("alice@example.com");
    });

    it("throws UNAUTHORIZED when user is not found", async () => {
        mockFindByEmail.mockResolvedValue(null);

        await expect(
            login("unknown@example.com", "password123"),
        ).rejects.toThrow(AppError);

        try {
            await login("unknown@example.com", "password123");
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect((error as AppError).statusCode).toBe(401);
            expect((error as AppError).code).toBe("UNAUTHORIZED");
        }
    });

    it("throws UNAUTHORIZED when password is wrong", async () => {
        mockFindByEmail.mockResolvedValue({
            id: 1,
            email: "alice@example.com",
            passwordHash: "$2b$10$invalidhash",
            role: "USER",
        });

        await expect(
            login("alice@example.com", "wrongpassword"),
        ).rejects.toThrow(AppError);
    });

    it("returns token and user on valid credentials", async () => {
        // Use bcrypt to hash a known password for testing
        const bcrypt = await import("bcrypt");
        const hash = await bcrypt.hash("password123", 10);

        mockFindByEmail.mockResolvedValue({
            id: 1,
            email: "alice@example.com",
            passwordHash: hash,
            role: "USER",
        });

        const result = await login("alice@example.com", "password123");

        expect(result).toHaveProperty("token");
        expect(result.user).toEqual({
            id: 1,
            email: "alice@example.com",
            role: "USER",
        });
        expect(typeof result.token).toBe("string");
        expect(result.token.length).toBeGreaterThan(0);
    });
});
