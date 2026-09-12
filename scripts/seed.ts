import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

import { users, orders } from "../src/db/schema.js";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const SALT_ROUNDS = 10;

const DEMO_PASSWORD = "password123";

async function seed() {
    console.log("Seeding database...");

    // Clear existing data (orders first due to foreign key)
    await db.delete(orders);
    await db.delete(users);

    // --- Users ---

    const adminHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
    const results = await db
        .insert(users)
        .values([
            {
                email: "admin@example.com",
                passwordHash: adminHash,
                role: "ADMIN",
            },
            {
                email: "alice@example.com",
                passwordHash: await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS),
                role: "USER",
            },
            {
                email: "bob@example.com",
                passwordHash: await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS),
                role: "USER",
            },
            {
                email: "charlie@example.com",
                passwordHash: await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS),
                role: "USER",
            },
        ])
        .returning({ id: users.id, email: users.email });

    const admin = results.find((u) => u.email === "admin@example.com")!;
    const alice = results.find((u) => u.email === "alice@example.com")!;
    const bob = results.find((u) => u.email === "bob@example.com")!;

    // charlie intentionally has no orders

    // --- Orders (for Alice) ---

    const aliceOrders = [
        {
            userId: alice.id,
            status: "COMPLETED" as const,
            totalAmount: "129.99",
            createdAt: new Date("2025-01-15T10:30:00Z"),
        },
        {
            userId: alice.id,
            status: "PROCESSING" as const,
            totalAmount: "49.50",
            createdAt: new Date("2025-02-20T14:15:00Z"),
        },
        {
            userId: alice.id,
            status: "PENDING" as const,
            totalAmount: "210.00",
            createdAt: new Date("2025-03-10T09:00:00Z"),
        },
        {
            userId: alice.id,
            status: "COMPLETED" as const,
            totalAmount: "35.75",
            createdAt: new Date("2025-04-05T16:45:00Z"),
        },
        {
            userId: alice.id,
            status: "CANCELLED" as const,
            totalAmount: "89.00",
            createdAt: new Date("2025-05-18T11:20:00Z"),
        },
    ];

    await db.insert(orders).values(aliceOrders);

    // --- Orders (for Bob) ---

    const bobOrders = [
        {
            userId: bob.id,
            status: "CONFIRMED" as const,
            totalAmount: "199.99",
            createdAt: new Date("2025-02-14T12:00:00Z"),
        },
        {
            userId: bob.id,
            status: "COMPLETED" as const,
            totalAmount: "75.25",
            createdAt: new Date("2025-03-22T08:30:00Z"),
        },
        {
            userId: bob.id,
            status: "PROCESSING" as const,
            totalAmount: "150.00",
            createdAt: new Date("2025-06-01T13:10:00Z"),
        },
    ];

    await db.insert(orders).values(bobOrders);

    // --- Summary ---

    console.log("\nSeed complete!\n");
    console.log("Demo credentials (password for all: password123):\n");
    console.log(`  Admin:  admin@example.com   (id: ${admin.id}, role: ADMIN)`);
    console.log(`  User 1: alice@example.com   (id: ${alice.id}, role: USER) — 5 orders`);
    console.log(`  User 2: bob@example.com     (id: ${bob.id}, role: USER) — 3 orders`);
    console.log(`  User 3: charlie@example.com (role: USER) — 0 orders`);
    console.log("");
}

seed()
    .then(() => {
        process.exit(0);
    })
    .catch((err) => {
        console.error("Seed failed:", err);
        process.exit(1);
    });
