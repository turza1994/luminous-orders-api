import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSelect, mockFrom, mockWhere, mockOrderBy, mockResult } =
    vi.hoisted(() => ({
        mockSelect: vi.fn(),
        mockFrom: vi.fn(),
        mockWhere: vi.fn(),
        mockOrderBy: vi.fn(),
        mockResult: [] as unknown[],
    }));

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

import { OrderRepository } from "../../../src/modules/orders/orders.repository.js";

function setupChain() {
    mockSelect.mockReturnValue({ from: mockFrom });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockWhere.mockReturnValue({ orderBy: mockOrderBy });
    mockOrderBy.mockImplementation(() => Promise.resolve([...mockResult]));
}

describe("OrderRepository", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockResult.length = 0;
        setupChain();
    });

    describe("findByUserId", () => {
        it("returns orders for the given user", async () => {
            const fakeOrders = [
                {
                    id: 1,
                    userId: 1,
                    status: "COMPLETED",
                    totalAmount: "99.99",
                    createdAt: new Date(),
                },
            ];
            mockResult.push(...fakeOrders);

            const result = await OrderRepository.findByUserId(1);

            expect(result).toEqual(fakeOrders);
            expect(mockSelect).toHaveBeenCalled();
            expect(mockOrderBy).toHaveBeenCalled();
        });

        it("returns empty array when user has no orders", async () => {
            const result = await OrderRepository.findByUserId(999);

            expect(result).toEqual([]);
        });
    });
});
