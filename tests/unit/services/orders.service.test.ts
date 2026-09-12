import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/repositories/UserRepository.js", () => ({
    UserRepository: {
        findByEmail: vi.fn(),
        findById: vi.fn(),
    },
}));

vi.mock("../../../src/repositories/OrderRepository.js", () => ({
    OrderRepository: {
        findByUserId: vi.fn(),
    },
}));

import { UserRepository } from "../../../src/modules/auth/users.repository.js";
import { OrderRepository } from "../../../src/modules/orders/orders.repository.js";
import { getUserOrders } from "../../../src/modules/orders/orders.service.js";
import { AppError } from "../../../src/errors/app-error.js";

const mockFindById = vi.mocked(UserRepository.findById);
const mockFindByUserId = vi.mocked(OrderRepository.findByUserId);

describe("OrdersService.getUserOrders", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("throws USER_NOT_FOUND when user does not exist", async () => {
        mockFindById.mockResolvedValue(null);

        await expect(
            getUserOrders(999, { id: 1, role: "USER" }),
        ).rejects.toThrow(AppError);

        try {
            await getUserOrders(999, { id: 1, role: "USER" });
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect((error as AppError).statusCode).toBe(404);
            expect((error as AppError).code).toBe("USER_NOT_FOUND");
        }
    });

    it("throws ORDER_HISTORY_ACCESS_DENIED when user accesses another user's orders", async () => {
        mockFindById.mockResolvedValue({ id: 2 });

        await expect(
            getUserOrders(2, { id: 1, role: "USER" }),
        ).rejects.toThrow(AppError);

        try {
            await getUserOrders(2, { id: 1, role: "USER" });
        } catch (error) {
            expect(error).toBeInstanceOf(AppError);
            expect((error as AppError).statusCode).toBe(403);
            expect((error as AppError).code).toBe(
                "ORDER_HISTORY_ACCESS_DENIED",
            );
        }
    });

    it("allows user to access their own orders", async () => {
        const mockOrders = [
            {
                id: 1,
                userId: 1,
                status: "COMPLETED" as const,
                totalAmount: "99.99",
                createdAt: new Date(),
            },
        ];
        mockFindById.mockResolvedValue({ id: 1 });
        mockFindByUserId.mockResolvedValue(mockOrders);

        const result = await getUserOrders(1, { id: 1, role: "USER" });

        expect(result).toEqual(mockOrders);
        expect(mockFindByUserId).toHaveBeenCalledWith(1);
    });

    it("allows admin to access any user's orders", async () => {
        const mockOrders = [
            {
                id: 1,
                userId: 2,
                status: "PENDING" as const,
                totalAmount: "50.00",
                createdAt: new Date(),
            },
        ];
        mockFindById.mockResolvedValue({ id: 2 });
        mockFindByUserId.mockResolvedValue(mockOrders);

        const result = await getUserOrders(2, { id: 99, role: "ADMIN" });

        expect(result).toEqual(mockOrders);
        expect(mockFindByUserId).toHaveBeenCalledWith(2);
    });

    it("returns empty array for user with no orders", async () => {
        mockFindById.mockResolvedValue({ id: 3 });
        mockFindByUserId.mockResolvedValue([]);

        const result = await getUserOrders(3, { id: 3, role: "USER" });

        expect(result).toEqual([]);
    });
});
