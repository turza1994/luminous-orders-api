import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSelect, mockFrom, mockWhere, mockLimit, mockResult } = vi.hoisted(
    () => ({
        mockSelect: vi.fn(),
        mockFrom: vi.fn(),
        mockWhere: vi.fn(),
        mockLimit: vi.fn(),
        mockResult: [] as unknown[],
    }),
);

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

vi.mock("../../../src/db/index.js", () => ({
    db: { select: mockSelect },
}));

import { UserRepository } from "../../../src/modules/auth/users.repository.js";

function setupChain() {
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockLimit.mockImplementation(() => Promise.resolve([...mockResult]));
}

describe("UserRepository", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockResult.length = 0;
        setupChain();
    });

    describe("findByEmail", () => {
        it("returns user when found", async () => {
            const fakeUser = {
                id: 1,
                email: "alice@example.com",
                passwordHash: "hash",
                role: "USER",
            };
            mockResult.push(fakeUser);

            const result = await UserRepository.findByEmail(
                "alice@example.com",
            );

            expect(result).toEqual(fakeUser);
            expect(mockSelect).toHaveBeenCalled();
            expect(mockLimit).toHaveBeenCalledWith(1);
        });

        it("returns null when user not found", async () => {
            const result = await UserRepository.findByEmail(
                "unknown@example.com",
            );

            expect(result).toBeNull();
        });
    });

    describe("findById", () => {
        it("returns user when found", async () => {
            mockResult.push({ id: 1 });

            const result = await UserRepository.findById(1);

            expect(result).toEqual({ id: 1 });
            expect(mockLimit).toHaveBeenCalledWith(1);
        });

        it("returns null when user not found", async () => {
            const result = await UserRepository.findById(999);

            expect(result).toBeNull();
        });
    });
});
